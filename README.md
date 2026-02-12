# Eloquence AI

A communication training platform that lets you simulate high-stakes conversations with AI-driven personas. Practice articulation, build confidence, and refine your professional communication.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up your OpenAI API key

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your OpenAI API key (get one at https://platform.openai.com/api-keys).

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

1. **Choose a track** — Professional (available) or Personal (coming soon).
2. **Configure a persona** — Name them, set the scenario, and tune 6 personality sliders.
3. **Simulate the conversation** — Chat naturally. The AI stays in character based on the personality matrix.
4. **Get feedback** — End the conversation to receive a detailed coaching report with confidence scores, articulation analysis, and alternative phrasings.

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** for styling
- **OpenAI GPT-4o** for persona simulation and feedback analysis
