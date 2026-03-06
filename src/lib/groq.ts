import Groq from 'groq-sdk'
import type { Question, Variant } from '@/types'

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
})

const VARIANT_PROMPT = (q: Question) => `
You are a DSA problem setter. Rewrite the following problem with a completely new theme or real-world context.
Keep the exact same algorithm and data structure required to solve it.
Change the title, description, and examples to fit the new theme.
The examples must be valid for the same underlying algorithm.

Original problem:
Title: ${q.title}
Description: ${q.description}
Examples: ${JSON.stringify(q.examples)}

Respond with ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "variantTitle": "...",
  "variantDescription": "...",
  "variantExamples": [
    { "input": "...", "output": "...", "explanation": "..." }
  ]
}
`

export async function generateVariant(question: Question): Promise<Variant> {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: VARIANT_PROMPT(question) }],
    temperature: 0.8,
    max_tokens: 1024,
  })

  const content = completion.choices[0]?.message?.content ?? ''

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in response')
    const parsed = JSON.parse(jsonMatch[0])
    return {
      questionId: question.id,
      variantTitle: parsed.variantTitle ?? question.title,
      variantDescription: parsed.variantDescription ?? question.description,
      variantExamples: parsed.variantExamples ?? question.examples,
    }
  } catch {
    return {
      questionId: question.id,
      variantTitle: question.title,
      variantDescription: question.description,
      variantExamples: question.examples,
    }
  }
}

export async function generateAllVariants(questions: Question[]): Promise<Variant[]> {
  const results = await Promise.allSettled(questions.map((q) => generateVariant(q)))
  return results.map((result, i) => {
    if (result.status === 'fulfilled') return result.value
    return {
      questionId: questions[i].id,
      variantTitle: questions[i].title,
      variantDescription: questions[i].description,
      variantExamples: questions[i].examples,
    }
  })
}
