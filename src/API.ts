/* eslint-disable @typescript-eslint/naming-convention */
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function processQuery(query:string, temperature=0, max_tokens=256){
        const res = await openai.createCompletion('code-davinci-001',{
            temperature:temperature,
            prompt:query,
            max_tokens:max_tokens
        });
        if (res.status >= 400){
            throw new Error('Authorization Failed');
        }
        if (!res.data.choices){
            throw new Error('oops, something went wrong');
            return;
        }
        return res.data.choices[0].text;
}

export {processQuery};