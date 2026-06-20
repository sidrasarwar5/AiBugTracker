from groq import Groq
from django.conf import settings
import re
import uuid


class AIService:
    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.model_name = "llama-3.3-70b-versatile"

    def _is_valid_bug_report(self, title: str, description: str) -> bool:
        """Check if the bug report has meaningful content"""
        title = title.strip()
        description = description.strip()

        if len(title) < 3 or len(description) < 3:
            return False

        clean_title = re.sub(r'[^a-zA-Z0-9\s]', '', title)
        clean_desc = re.sub(r'[^a-zA-Z0-9\s]', '', description)

        title_alpha_ratio = sum(c.isalpha() for c in title) / max(len(title), 1)
        desc_alpha_ratio = sum(c.isalpha() for c in description) / max(len(description), 1)

        if title_alpha_ratio < 0.2 or desc_alpha_ratio < 0.2:
            return False

        if not any(c in 'aeiouAEIOU' for c in title) and len(title) > 5:
            return False

        return True

    def generate_text(self, prompt: str) -> str:
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"AI generation error: {e}")
            return None

    # ============================================
    # AI Assist - Improve Bug Report
    # ============================================
    def improve_bug_report(self, title: str, description: str) -> dict:
        if not self._is_valid_bug_report(title, description):
            print("Invalid bug report - skipping AI processing")
            return {
                "error": "Bug report is too short or contains invalid content",
                "suggested_title": title,
                "missing_info": "Please provide more details (minimum 5 characters)",
                "improved_description": description,
                "is_valid": False
            }

        prompt = f"""You are a senior QA engineer helping improve a bug report.
The bug report MUST be specific and actionable - NO placeholders like [Specific Action] or generic text.

Current Bug Report:
TITLE: {title}
DESCRIPTION: {description}

Based on the ACTUAL content provided above, create an improved version:
1. The suggested title MUST use SPECIFIC details from the report
2. The missing info MUST list concrete missing elements
3. The improved description MUST be a complete rewrite using actual details

Format your response EXACTLY as:
SUGGESTED_TITLE: <specific title based on actual content>
MISSING_INFO: <list of specific missing details or "None">
IMPROVED_DESCRIPTION: <complete rewritten description with actual details>

If the report is unclear, still try your best to use the actual content. Be specific!"""

        result = self.generate_text(prompt)
        
        # Check if AI service failed
        if not result:
            return {
                "error": "AI service is currently unavailable. Please try again later.",
                "suggested_title": title,
                "missing_info": "AI service unavailable - quota may be exceeded or service may be down",
                "improved_description": description,
                "is_valid": False
            }

        suggestions = self._parse_suggestions(result)
        
        # If parse_suggestions found an error
        if suggestions.get("error"):
            suggestions["error"] = "AI service returned invalid response. Please try again."
            suggestions["is_valid"] = False
            suggestions["suggested_title"] = title
            suggestions["missing_info"] = "AI service unavailable - please try again later"
            suggestions["improved_description"] = description
            return suggestions

        # Post-process to remove placeholders
        for key in ["suggested_title", "missing_info", "improved_description"]:
            if key in suggestions:
                suggestions[key] = re.sub(r'\[.*?\]', '', suggestions[key])
                suggestions[key] = re.sub(r'<.*?>', '', suggestions[key])
                suggestions[key] = ' '.join(suggestions[key].split())

        if "Specific Action" in suggestions.get("suggested_title", "") or "[Specific" in suggestions.get("suggested_title", ""):
            suggestions["suggested_title"] = title

        suggestions["is_valid"] = True
        suggestions["error"] = None
        return suggestions

    def _parse_suggestions(self, text: str) -> dict:
        suggestions = {
            "suggested_title": "",
            "missing_info": "",
            "improved_description": "",
            "error": None,
            "is_valid": True
        }
        
        # If text is empty or None, return error
        if not text:
            suggestions["error"] = "AI service returned empty response"
            suggestions["is_valid"] = False
            return suggestions
        
        for line in text.split("\n"):
            line = line.strip()
            if line.startswith("SUGGESTED_TITLE:"):
                suggestions["suggested_title"] = line.replace("SUGGESTED_TITLE:", "").strip()
            elif line.startswith("MISSING_INFO:"):
                suggestions["missing_info"] = line.replace("MISSING_INFO:", "").strip()
            elif line.startswith("IMPROVED_DESCRIPTION:"):
                suggestions["improved_description"] = line.replace("IMPROVED_DESCRIPTION:", "").strip()
        
        # Check if parsing failed
        if not any([suggestions["suggested_title"], suggestions["missing_info"], suggestions["improved_description"]]):
            suggestions["error"] = "Failed to parse AI response"
            suggestions["is_valid"] = False
        
        return suggestions

    # ============================================
    # AI Categorization
    # ============================================
    def categorize_bug(self, title: str, description: str) -> dict:
        """AI automatically categorizes the bug"""

        if not self._is_valid_bug_report(title, description):
            return {
                "error": "Please provide more details for better categorization",
                "type": "bug",
                "priority": "medium",
                "category": "other",
                "reason": "Not enough information to categorize",
                "is_valid": False
            }

        prompt = f"""Analyze this bug report and categorize it.

Title: {title}
Description: {description}

Return ONLY these categories in this exact format:
TYPE: <bug or feature>
PRIORITY: <critical/high/medium/low>
CATEGORY: <ui/backend/database/auth/api/performance/security/other>
REASON: <brief explanation of your choices>

Be specific and use the actual content to make decisions."""

        result = self.generate_text(prompt)
        
        # Check if AI service failed
        if not result:
            return {
                "error": "AI service is currently unavailable. Please try again later.",
                "type": "bug",
                "priority": "medium",
                "category": "other",
                "reason": "AI service unavailable - quota may be exceeded",
                "is_valid": False
            }

        categories = self._parse_categorization(result)
        
        # If parse_categorization found an error
        if categories.get("error"):
            categories["is_valid"] = False
            return categories
        
        categories["is_valid"] = True
        categories["error"] = None
        return categories

    def _parse_categorization(self, text: str) -> dict:
        categories = {
            "type": "bug",
            "priority": "medium",
            "category": "other",
            "reason": "",
            "error": None,
            "is_valid": True
        }
        
        if not text:
            categories["error"] = "AI service returned empty response"
            categories["is_valid"] = False
            return categories
        
        for line in text.split("\n"):
            line = line.strip()
            if line.startswith("TYPE:"):
                categories["type"] = line.replace("TYPE:", "").strip().lower()
            elif line.startswith("PRIORITY:"):
                categories["priority"] = line.replace("PRIORITY:", "").strip().lower()
            elif line.startswith("CATEGORY:"):
                categories["category"] = line.replace("CATEGORY:", "").strip().lower()
            elif line.startswith("REASON:"):
                categories["reason"] = line.replace("REASON:", "").strip()
        
        return categories

    # ============================================
    # Semantic Search
    # ============================================
    def semantic_search(self, query: str, bugs: list) -> dict:
        """
        Search bugs by semantic meaning using AI

        Returns:
            dict with:
              - "ids": list of bug IDs sorted by relevance. Length varies
                based on how many bugs are actually relevant -- never
                padded to a fixed count.
              - "method": "ai" if the model actually answered, "fallback" if
                quota was exhausted or the call failed and keyword matching
                was used instead.
        """
        if not query or not bugs:
            return {"ids": [], "method": "ai"}

        if len(bugs) > 30:
            bugs = bugs[:30]

        prompt = f"""You are searching bug reports by meaning, not exact keywords.

SEARCH: "{query}"

Bugs:
"""
        for idx, bug in enumerate(bugs, 1):
            desc = bug['description'][:200] if bug['description'] else "No description"
            prompt += f"{idx}. {bug['title']} - {desc}\n"

        prompt += f"""
Identify ONLY the bugs that are genuinely relevant to the search -- meaning
a real user looking for "{query}" would actually want to see that bug.
Do NOT include a bug just to fill out a list. It is completely normal and
expected to return zero, one, two, or any other number of bugs -- only
return what is genuinely relevant, nothing more.

Return the numbers of the relevant bugs, separated by commas, ordered
from most to least relevant. If NONE are relevant, respond with exactly:
NONE

Example responses:
3, 1, 5
2
NONE

DO NOT include any other text, explanations, or the word "and".
"""

        result = self.generate_text(prompt)
        if not result:
            fallback_ids = self._fallback_keyword_search(query, bugs)
            return {"ids": fallback_ids, "method": "fallback"}

        if result.strip().upper().startswith("NONE"):
            return {"ids": [], "method": "ai"}

        numbers = re.findall(r'\d+', result)

        if numbers:
            indices = []
            for num in numbers:
                idx = int(num) - 1
                if 0 <= idx < len(bugs):
                    indices.append(idx)

            seen = set()
            unique_indices = []
            for idx in indices:
                if idx not in seen:
                    seen.add(idx)
                    unique_indices.append(idx)

            return {"ids": [bugs[idx]['id'] for idx in unique_indices], "method": "ai"}

        fallback_ids = self._fallback_keyword_search(query, bugs)
        return {"ids": fallback_ids, "method": "fallback"}

    # Words too generic to mean anything on their own -- appear in almost
    # every bug report regardless of topic, so they shouldn't count as a
    # "match" by themselves. Used only by the offline keyword fallback,
    # which has no real understanding of meaning.
    _STOP_WORDS = {
        "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
        "issue", "issues", "problem", "problems", "bug", "bugs", "error",
        "errors", "not", "no", "working", "work", "works", "broken", "fix",
        "fixed", "fixing", "wrong", "bad", "good", "with", "for", "and",
        "or", "to", "of", "in", "on", "at", "it", "this", "that", "i",
        "we", "you", "have", "has", "had", "do", "does", "did", "can",
        "could", "please", "when", "there", "here", "appears", "appear",
        "across", "leading", "causing", "cause",
    }

    def _fallback_keyword_search(self, query: str, bugs: list) -> list:
        """
        Fallback search if AI fails - simple keyword matching.

        Generic filler words (see _STOP_WORDS) are ignored when scoring,
        so a query like "authentication issue" only meaningfully matches
        on "authentication" -- "issue" alone, appearing in an unrelated
        bug's description, is no longer enough to surface it.
        """
        if not query or not bugs:
            return []

        query_words = {w for w in query.lower().split() if w not in self._STOP_WORDS}

        # If every word in the query was a stop word, fall back to using
        # the original words rather than matching nothing at all.
        if not query_words:
            query_words = set(query.lower().split())

        scored_bugs = []
        for bug in bugs:
            score = 0
            text = (bug['title'] + ' ' + bug.get('description', '')).lower()
            for word in query_words:
                if word in text:
                    score += 1
            if score > 0:
                scored_bugs.append((score, bug['id']))

        scored_bugs.sort(reverse=True)
        return [bug_id for _, bug_id in scored_bugs[:10]]



# ============================================
    # Chatbot
    # ============================================
    def detect_intent(self, message: str) -> str:
        """
        Simple keyword-based intent detection. Returns one of:
        'my_bugs', 'project_bugs', 'bug_status', 'project_stats', 'general'
        """
        text = message.lower()

        if any(w in text for w in ["my bug", "assigned to me", "my task"]):
            return "my_bugs"
        if any(w in text for w in ["status of", "bug #", "bug number"]):
            return "bug_status"
        if any(w in text for w in ["how many", "count", "stats", "summary"]):
            return "project_stats"
        if any(w in text for w in ["project", "bugs in"]):
            return "project_bugs"
        return "general"

    def answer_chat_message(self, message: str, context_data: str) -> str:
        """
        Takes the user's question plus pre-fetched DB context (already
        filtered by their permissions) and asks the LLM to answer
        naturally using only that data.
        """
        prompt = f"""You are a helpful assistant inside a bug tracking app.
Answer the user's question using ONLY the data provided below. Be concise
and natural -- like a helpful colleague, not a robot reading a database.
If the data is empty or doesn't answer the question, say so honestly.

USER QUESTION: {message}

DATA:
{context_data}

Answer in 1-4 sentences. Do not make up information not in the data above."""

        result = self.generate_text(prompt)
        if not result:
            return "Sorry, I couldn't process that right now. Please try again in a moment."
        return result.strip()
    



# ============================================
    # Resolution Suggestions (RAG)
    # ============================================
    def suggest_resolution(self, title: str, description: str, bug_type: str, resolved_bugs: list) -> dict:
        """
        Suggest how to resolve/implement the current bug or feature,
        grounded in how similar past resolved items were actually
        handled (RAG-style: retrieve similar resolved items, then
        generate a suggestion using their real resolution_notes as
        context -- not just the model's general knowledge).

        Args:
            title, description, bug_type: the CURRENT unresolved item.
            resolved_bugs: list of dicts, each with
                {"id", "title", "description", "type", "resolution_notes"}
                -- already filtered to RESOLVED/COMPLETED items only,
                visible to the requesting user, fetched by the caller.

        Returns:
            dict with:
              - "suggestion": str, the AI's suggested approach
              - "similar_bugs": list of {"id", "title"} actually used
                as grounding context (so the frontend can show "based
                on these N similar past items" with links)
              - "method": "ai" | "fallback"
              - "error": str | None
        """
        if not title or not description:
            return {
                "suggestion": "",
                "similar_bugs": [],
                "method": "ai",
                "error": "Title and description are required.",
            }

        if not resolved_bugs:
            return {
                "suggestion": "No similar resolved items were found yet to base a suggestion on.",
                "similar_bugs": [],
                "method": "ai",
                "error": None,
            }

        # Reuse the same prompt-ranking approach as semantic_search to
        # find which of the resolved items are actually similar to this
        # one, instead of just dumping every resolved item into the
        # final prompt (keeps the final prompt focused and on-topic).
        search_query = f"{title} {description}"
        searchable = [
            {"id": b["id"], "title": b["title"], "description": b["description"]}
            for b in resolved_bugs
        ]
        similarity_result = self.semantic_search(search_query, searchable)
        similar_ids = similarity_result["ids"][:5]  # cap context size
        method = similarity_result["method"]

        if not similar_ids:
            return {
                "suggestion": "No closely related resolved items were found to base a suggestion on.",
                "similar_bugs": [],
                "method": method,
                "error": None,
            }

        resolved_by_id = {b["id"]: b for b in resolved_bugs}
        similar_items = [resolved_by_id[i] for i in similar_ids if i in resolved_by_id]

        context_blocks = []
        for item in similar_items:
            notes = item.get("resolution_notes") or "(no notes recorded)"
            context_blocks.append(
                f"- \"{item['title']}\" ({item['type']})\n"
                f"  Description: {item['description'][:200]}\n"
                f"  How it was resolved: {notes[:400]}"
            )
        context_text = "\n".join(context_blocks)

        prompt = f"""You are helping a developer resolve a {bug_type} report, using how
similar past items were actually fixed in this codebase as your guide.

CURRENT {bug_type.upper()}:
Title: {title}
Description: {description}

SIMILAR PAST ITEMS THAT WERE ALREADY RESOLVED:
{context_text}

Based on how these similar items were actually resolved, suggest a likely
approach for the current one. Be concrete and grounded in the patterns
above -- do not invent unrelated technical details. If the past resolutions
don't clearly point to an approach, say so honestly rather than guessing.

Keep your answer to 2-4 sentences."""

        result = self.generate_text(prompt)
        if not result:
            return {
                "suggestion": "AI service is currently unavailable. Please try again later.",
                "similar_bugs": [{"id": i["id"], "title": i["title"]} for i in similar_items],
                "method": "fallback",
                "error": "AI service unavailable",
            }

        return {
            "suggestion": result.strip(),
            "similar_bugs": [{"id": i["id"], "title": i["title"]} for i in similar_items],
            "method": method,
            "error": None,
        }