import asyncio
import json
import logging
import random
from dataclasses import dataclass
from typing import Optional, Dict, List, Tuple
from uuid import uuid4

from dotenv import load_dotenv
from livekit import api
from livekit.plugins import google, deepgram, silero
from livekit.agents import (
    Agent,
    AgentSession,
    ChatContext,
    JobContext,
    JobProcess,
    RoomInputOptions,
    RoomOutputOptions,
    RunContext,
    WorkerOptions,
    cli,
    metrics,
)
from livekit.agents.job import get_job_context
from livekit.agents.llm import function_tool
from livekit.agents.voice import MetricsCollectedEvent
from livekit.plugins.turn_detector.multilingual import MultilingualModel

# Setup logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("debate-ai")

load_dotenv()

# Common instructions for debater agents
debater_instructions = (
    "You are a debater in a public forum debate. Your goal is to present compelling, "
    "logical, and evidence-based arguments based on your assigned role (Pro or Con) and "
    "the debate topic. During crossfire, engage directly with your opponent’s points, "
    "asking questions or countering arguments. In rebuttals, interrupt if necessary to "
    "counter weak or incorrect points, but remain respectful. Always end your turn with "
    "a question or prompt to keep the conversation interactive."
)

# Debate topics
DEBATE_TOPICS = [
    "Should social media platforms regulate misinformation?",
    "Is universal basic income a viable economic policy?",
    "Should space exploration be prioritized over climate change solutions?",
]

# Debate rounds and timings
ROUNDS = [
    ("constructive_a", 4 * 60, "A"),
    ("constructive_c", 4 * 60, "C"),
    ("crossfire_ac", 3 * 60, ["A", "C"]),
    ("rebuttal_b", 4 * 60, "B"),
    ("rebuttal_d", 4 * 60, "D"),
    ("crossfire_bd", 3 * 60, ["B", "D"]),
    ("summary_a", 3 * 60, "A"),
    ("summary_c", 3 * 60, "C"),
    ("grand_crossfire", 3 * 60, ["A", "B", "C", "D"]),
    ("final_focus_b", 2 * 60, "B"),
    ("final_focus_d", 2 * 60, "D"),
]

@dataclass
class DebateState:
    room_id: str  # Room identifier for multi-room support
    mode: str  # "single" or "multi"
    round_index: int  # Index in ROUNDS
    time_remaining: float  # Seconds
    roles: Dict[str, str]  # e.g., {"T1": "Pro", "T2": "Con"}
    topic: str
    scores: Dict[str, List[int]]  # e.g., {"T1": [25, 27], "T2": [26, 28]}
    prep_time: Dict[str, float]  # Remaining prep time per team (seconds)
    transcripts: Dict[str, Dict[str, List[str]]]  # Transcripts per speaker per round
    custom_rounds: Optional[List[Tuple[str, int, List[str]]]] = None  # Support custom formats

class DebaterAgent(Agent):
    def __init__(self, debater_id: str, role: str, team: str, topic: str, *, chat_ctx: Optional[ChatContext] = None):
        super().__init__(
            instructions=(
                f"{debater_instructions} Your ID is {debater_id}, representing team {team} "
                f"with role {role}. The debate topic is: {topic}. Adapt your arguments to the "
                "current round (e.g., constructive, rebuttal, crossfire) and respond to opponents’ points."
            ),
            llm=google.LLM(model="gemini-1.5-flash", temperature=0.8),
            stt=deepgram.STT(model="nova-3", language="multi"),
            tts=deepgram.TTS(model="aura-asteria-en"),
            turn_detection=MultilingualModel(),
            chat_ctx=chat_ctx,
        )
        self.debater_id = debater_id
        self.role = role
        self.team = team
        self.topic = topic
        self.can_speak = False

    async def on_enter(self):
        if self.can_speak:
            await self.session.generate_reply()

    @function_tool
    async def set_speaking(self, context: RunContext[DebateState], can_speak: bool):
        """Called by Moderator to enable or disable speaking."""
        self.can_speak = can_speak
        logger.debug(f"Debater {self.debater_id} speaking set to {can_speak}")
        if can_speak:
            await self.session.generate_reply()

    @function_tool
    async def receive_transcript(self, context: RunContext[DebateState], speaker: str, text: str):
        """Receive and store transcript for this debater."""
        round_name = ROUNDS[context.userdata.round_index][0]
        if round_name not in context.userdata.transcripts:
            context.userdata.transcripts[round_name] = {}
        if speaker not in context.userdata.transcripts[round_name]:
            context.userdata.transcripts[round_name][speaker] = []
        context.userdata.transcripts[round_name][speaker].append(text[:1000])  # Limit text length
        # Save to file for persistence
        with open(f"transcripts_{context.userdata.room_id}_{round_name}.json", "a") as f:
            json.dump({speaker: text}, f, indent=2)

class ModeratorAgent(Agent):
    def __init__(self):
        super().__init__(
            instructions=(
                "You are the moderator of a public forum debate. Assign Pro/Con roles randomly, "
                "select a topic, announce rounds, manage timers, and ensure smooth transitions. "
                "Offer prep time (2 min/team) when requested. Interrupt speakers when time is up. "
                "Announce scores from the Judge and transition to the next round or end the debate."
            ),
            llm=google.LLM(model="gemini-1.5-flash", temperature=0.5),
            tts=deepgram.TTS(model="aura-asteria-en"),
        )
        self.debate_state = None

    async def on_enter(self):
        await self.initialize_debate()

    async def initialize_debate(self):
        # Assign roles and topic
        roles = ["Pro", "Con"]
        random.shuffle(roles)
        self.debate_state.roles = {"T1": roles[0], "T2": roles[1]}
        self.debate_state.topic = random.choice(DEBATE_TOPICS)
        self.debate_state.prep_time = {"T1": 2 * 60, "T2": 2 * 60}
        self.debate_state.round_index = 0
        self.debate_state.transcripts = {}
        await self.announce(
            f"Team T1 (A, B) is {self.debate_state.roles['T1']}, "
            f"Team T2 (C, D) is {self.debate_state.roles['T2']}. "
            f"Topic: {self.debate_state.topic}"
        )
        await self.offer_prep_time()

    async def announce(self, message: str):
        await self.session.room.send_data(
            json.dumps({"type": "announcement", "message": message}).encode(),
            to=None
        )
        logger.info(f"Announcement: {message}")

    async def offer_prep_time(self):
        await self.announce("Do teams need prep time? Reply with team ID (T1/T2) to request.")
        # Handle prep time requests via data channel (simplified: assume no prep for now)
        await self.start_round()

    async def start_round(self):
        rounds = self.debate_state.custom_rounds or ROUNDS
        if self.debate_state.round_index >= len(rounds):
            await self.end_debate()
            return
        round_name, duration, speakers = rounds[self.debate_state.round_index]
        self.debate_state.time_remaining = duration
        is_crossfire = isinstance(speakers, list)
        await self.announce(f"Starting round: {round_name.replace('_', ' ').title()}")
        await self.session.room.send_data(
            json.dumps({
                "type": "state",
                "round": round_name,
                "speakers": speakers,
                "time_remaining": duration
            }).encode(),
            to=None
        )
        # Enable speaking for current speakers
        for debater_id in (speakers if is_crossfire else [speakers]):
            if debater_id in ["C", "D"] or (self.debate_state.mode == "single" and debater_id == "B"):
                await self.session.room.send_data(
                    json.dumps({"type": "set_speaking", "can_speak": True}).encode(),
                    to=f"debater_{debater_id.lower()}"
                )
        # Start precise timer
        end_time = asyncio.get_event_loop().time() + duration
        while asyncio.get_event_loop().time() < end_time:
            await asyncio.sleep(0.1)  # Higher resolution
            self.debate_state.time_remaining = end_time - asyncio.get_event_loop().time()
            await self.session.room.send_data(
                json.dumps({
                    "type": "state",
                    "round": round_name,
                    "speakers": speakers,
                    "time_remaining": self.debate_state.time_remaining
                }).encode(),
                to=None
            )
            if self.debate_state.time_remaining <= 0:
                break
        await self.announce("Time's up! Please stop speaking.")
        if is_crossfire:
            for debater_id in speakers:
                if debater_id in ["C", "D"] or (self.debate_state.mode == "single" and debater_id == "B"):
                    await self.session.room.send_data(
                        json.dumps({"type": "set_speaking", "can_speak": False}).encode(),
                        to=f"debater_{debater_id.lower()}"
                    )
        else:
            debater_id = speakers
            if debater_id in ["C", "D"] or (self.debate_state.mode == "single" and debater_id == "B"):
                await self.session.room.send_data(
                    json.dumps({"type": "set_speaking", "can_speak": False}).encode(),
                    to=f"debater_{debater_id.lower()}"
                )
        # Check for short round penalty (for 3-min rounds)
        if duration == 3 * 60 and self.debate_state.time_remaining < 0:
            shortfall = abs(self.debate_state.time_remaining)
            await self.announce(f"Warning: Round ended {shortfall:.1f}s early. Points may be deducted.")
        self.debate_state.round_index += 1
        await self.session.room.send_data(
            json.dumps({"type": "score_round"}).encode(),
            to="judge"
        )

    async def end_debate(self):
        await self.announce("Debate concluded. Awaiting final scores from the Judge.")
        await self.session.room.send_data(
            json.dumps({"type": "finalize_scores"}).encode(),
            to="judge"
        )

    @function_tool
    async def request_prep_time(self, context: RunContext[DebateState], team: str):
        """Handle prep time request from a team."""
        if team not in context.userdata.prep_time:
            await self.announce(f"Invalid team: {team}")
            return
        available = context.userdata.prep_time[team]
        if available <= 0:
            await self.announce(f"Team {team} has no prep time remaining.")
            return
        duration = min(available, 2 * 60)
        context.userdata.prep_time[team] -= duration
        await self.announce(f"Team {team} using {duration/60:.1f} min of prep time.")
        await asyncio.sleep(duration)
        await self.announce(f"Prep time for Team {team} is over.")
        await self.start_round()

class JudgeAgent(Agent):
    def __init__(self):
        super().__init__(
            instructions=(
                "You are a judge in a public forum debate. Evaluate arguments based on logic, "
                "evidence, delivery, and refutation. Assign scores from 21-30 per round: "
                "29-30 (Outstanding), 27-28 (Excellent), 25-26 (Good), 23-24 (Fair), 21-22 (Poor). "
                "Verify factual claims using your knowledge or reasoning. Add 1-2 points for verified "
                "facts, deduct 1-2 points for incorrect facts. Provide constructive feedback."
            ),
            llm=google.LLM(model="gemini-1.5-flash", temperature=0.5),
        )
        self.score_history = []

    async def evaluate_round(self, round_name: str, transcripts: Dict[str, List[str]], state: DebateState) -> Tuple[int, int]:
        prompt = (
            f"Evaluate the following debate round ({round_name}) based on logic, evidence, delivery, and refutation. "
            f"Assign scores from 21-30 for each team (T1: A, B; T2: C, D). Verify factual claims and adjust scores: "
            f"+1-2 for verified facts, -1-2 for incorrect facts. Provide a brief explanation.\n\n"
            f"Transcripts:\n"
        )
        for speaker, texts in transcripts.items():
            prompt += f"{speaker}: {' '.join(texts)}\n"
        score_t1, score_t2, explanation = 25, 25, "Default score"
        for attempt in range(3):  # Retry up to 3 times
            try:
                response = await self.llm.generate(prompt)
                result = json.loads(response.text) if response.text else {}
                score_t1 = min(max(result.get("T1", 25), 21), 30)
                score_t2 = min(max(result.get("T2", 25), 21), 30)
                explanation = result.get("explanation", "No explanation provided")
                break
            except (json.JSONDecodeError, Exception) as e:
                logger.warning(f"Attempt {attempt + 1} failed: {e}")
                if attempt == 2:
                    explanation = "Failed to evaluate round"
        # Apply shortfall penalty for 3-min rounds
        if ROUNDS[state.round_index][1] == 3 * 60 and state.time_remaining < 0:
            shortfall = abs(state.time_remaining) / 30  # 1 point per 30s shortfall
            score_t1 = max(21, score_t1 - int(shortfall))
            score_t2 = max(21, score_t2 - int(shortfall))
            explanation += f" Deducted {shortfall:.1f} points for early round end."
        self.score_history.append({
            "round": round_name,
            "T1_score": score_t1,
            "T2_score": score_t2,
            "explanation": explanation
        })
        return score_t1, score_t2

    @function_tool
    async def score_round(self, context: RunContext[DebateState]):
        round_name = ROUNDS[context.userdata.round_index - 1][0]
        transcripts = context.userdata.transcripts.get(round_name, {})
        score_t1, score_t2 = await self.evaluate_round(round_name, transcripts, context.userdata)
        context.userdata.scores["T1"].append(score_t1)
        context.userdata.scores["T2"].append(score_t2)
        await self.session.room.send_data(
            json.dumps({
                "type": "scores",
                "round": round_name,
                "T1_score": score_t1,
                "T2_score": score_t2,
                "explanation": self.score_history[-1]["explanation"]
            }).encode(),
            to=None
        )
        await self.session.room.send_data(
            json.dumps({"type": "continue_debate"}).encode(),
            to="moderator"
        )

    @function_tool
    async def finalize_scores(self, context: RunContext[DebateState]):
        avg_t1 = sum(context.userdata.scores["T1"]) / len(context.userdata.scores["T1"]) if context.userdata.scores["T1"] else 0
        avg_t2 = sum(context.userdata.scores["T2"]) / len(context.userdata.scores["T2"]) if context.userdata.scores["T2"] else 0
        winner = "T1" if avg_t1 > avg_t2 else "T2" if avg_t2 > avg_t1 else "Tie"
        feedback = {
            "winner": winner,
            "T1_avg_score": round(avg_t1, 2),
            "T2_avg_score": round(avg_t2, 2),
            "T1_strengths": "Strong logic and delivery" if avg_t1 >= 27 else "Consistent arguments",
            "T1_improvements": "Improve evidence if T1 lost" if winner == "T2" else "Maintain clarity",
            "T2_strengths": "Effective refutation" if avg_t2 >= 27 else "Good engagement",
            "T2_improvements": "Enhance factual accuracy if T2 lost" if winner == "T1" else "Sustain persuasiveness",
            "score_history": self.score_history
        }
        with open(f"debate_results_{context.userdata.room_id}.json", "w") as f:
            json.dump(feedback, f, indent=2)
        await self.session.room.send_data(
            json.dumps({
                "type": "final_results",
                "winner": winner,
                "T1_avg_score": round(avg_t1, 2),
                "T2_avg_score": round(avg_t2, 2),
                "feedback": feedback
            }).encode(),
            to=None
        )
        job_ctx = get_job_context()
        await job_ctx.api.room.delete_room(api.DeleteRoomRequest(room=job_ctx.room.name))

def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()

async def entrypoint(ctx: JobContext):
    await ctx.connect()
    # Safely access and parse metadata
    metadata = {}
    try:
        if hasattr(ctx.job, 'metadata') and ctx.job.metadata:
            if isinstance(ctx.job.metadata, str):
                metadata = json.loads(ctx.job.metadata)
            elif isinstance(ctx.job.metadata, dict):
                metadata = ctx.job.metadata
            else:
                logger.warning(f"Unexpected metadata type: {type(ctx.job.metadata)}, value: {ctx.job.metadata}")
        logger.debug(f"Parsed metadata: {metadata}")
    except (json.JSONDecodeError, TypeError) as e:
        logger.error(f"Failed to parse metadata: {e}")
        return

    if not metadata or "agent_name" not in metadata:
        logger.error(f"Critical metadata missing: {metadata}")
        return

    mode = metadata.get("mode", "multi")
    agent_name = metadata.get("agent_name")

    logger.info(f"Starting agent: {agent_name}, mode: {mode}")

    session = AgentSession[DebateState](
        vad=ctx.proc.userdata["vad"],
        llm=google.LLM(model="gemini-1.5-flash", temperature=0.8),
        stt=deepgram.STT(model="nova-3", language="multi"),
        tts=deepgram.TTS(model="aura-asteria-en"),
        turn_detection=MultilingualModel(),
        userdata=DebateState(
            room_id=ctx.room.name,
            mode=mode,
            round_index=0,
            time_remaining=0,
            roles={},
            topic="",
            scores={"T1": [], "T2": []},
            prep_time={},
            transcripts={}
        ),
    )

    if agent_name in ["debater_c", "debater_d", "debater_b"]:
        # Wait for moderator to initialize roles and topic
        for _ in range(10):  # Retry for 10 seconds
            if session.userdata.roles and session.userdata.topic:
                break
            await asyncio.sleep(1)
        if not session.userdata.roles or not session.userdata.topic:
            logger.error(f"DebateState not initialized for {agent_name}")
            return

    if agent_name == "debater_c":
        agent = DebaterAgent("C", session.userdata.roles.get("T2", "Con"), "T2", session.userdata.topic)
    elif agent_name == "debater_d":
        agent = DebaterAgent("D", session.userdata.roles.get("T2", "Con"), "T2", session.userdata.topic)
    elif agent_name == "debater_b" and mode == "single":
        agent = DebaterAgent("B", session.userdata.roles.get("T1", "Pro"), "T1", session.userdata.topic)
    elif agent_name == "moderator":
        agent = ModeratorAgent()
        session.userdata = agent.debate_state  # Share state
    elif agent_name == "judge":
        agent = JudgeAgent()
    else:
        logger.error(f"Unknown agent name: {agent_name}, Metadata: {metadata}")
        return

    # Handle incoming data messages
    @session.on("data_received")
    async def on_data_received(data: bytes, participant: str):
        try:
            message = json.loads(data.decode())
            logger.debug(f"Received data message: {message} from {participant}")
            if message["type"] == "transcript":
                await agent.receive_transcript(session, participant, message["text"])
            elif message["type"] == "request_prep_time" and agent_name == "moderator":
                await agent.request_prep_time(session, message["team"])
            elif message["type"] == "continue_debate" and agent_name == "moderator":
                await agent.start_round()
        except Exception as e:
            logger.error(f"Error processing data: {e}")

    # Collect metrics
    @session.on("metrics_collected")
    async def on_metrics_collected(evt: MetricsCollectedEvent):
        metrics.increment_counter("debate_agent_events", labels={"agent_name": agent_name})
        logger.info(f"Metrics: {evt.metrics}")

    await session.start(
        agent=agent,
        room=ctx.room,
        room_input_options=RoomInputOptions(),
        room_output_options=RoomOutputOptions(transcription_enabled=True),
    )

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
