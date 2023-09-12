import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"]
});

export async function openaiHelper(error: any): Promise<string | null | undefined> {
  // Question: How can use kubectl? is placeholder for the user input.
  if (!error) {
    return;
  }
  let content = error;

  if (error?.error) {
    content = error?.error;
    content = content.replace(/'/g, '');
  }
  const teststream = await openai.chat.completions.create({ messages: [{ role: 'user', content: content }], model: 'gpt-3.5-turbo', stream: true }, {
    timeout: 5 * 1000,
  });
  for await (const part of teststream) {
    process.stdout.write(part.choices[0]?.delta?.content || '');
    return part.choices[0]?.delta?.content;
  }

  console.log(teststream);

  return undefined;
}
