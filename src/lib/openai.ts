// [CYCL:625421ab-4d0b-4318-b76a-e7e561ad3a77] OpenAI client singleton using OPENAI_API_KEY environment variable
import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})
