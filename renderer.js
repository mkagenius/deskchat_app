// Set up the OpenAI API client

const { intro, isCancel, outro, spinner, text } = require('@clack/prompts');
const { Configuration, OpenAIApi } = require('openai');
const hljs = require('highlight.js');
hljs.highlightAll();

const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
  organization: OPENAI_ORG_ID
});
const openaiClient = new OpenAIApi(configuration);

const questionForm = document.getElementById('question-form');
const questionInput = document.getElementById('question-input');
const responseContainer = document.getElementById('response-container');
const askButton = questionForm.querySelector('button');

const toggleDots = (show) => {
  const dotsContainer = document.getElementById('dots-container');
  if (show) {
    dotsContainer.style.display = 'flex';
  } else {
    dotsContainer.style.display = 'none';
  }
};



const askChatGPT = async (question, messages) => {
  const prompt = {
    messages: [],
  };
  for (let i = Math.max(messages.length - 20, 0); i < messages.length; i++) {
    const m = messages[i].content;
    prompt.messages.push({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: m,
    });
  }
  prompt.messages.push({
    role: 'user',
    content: question,
  });

  const response = await openaiClient.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: prompt.messages,
  });

  return response.data.choices[0].message.content;
};

const messages = [];
toggleDots(false);
questionForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const question = questionInput.value;
  if (!question || question.trim().length === 0) return;
  askButton.disabled = true;
  const s = spinner();
  s.start('Thinking...');
toggleDots(true);
  const answer = await askChatGPT(question, messages);
toggleDots(false);
  console.log("answer: ", answer);
  messages.push({role: 'user', content: question});
  if (answer) {
 responseContainer.innerHTML = answer.replace(/```([a-zA-Z+]+)?\n([\s\S]*?)```|(?<!`)`([\s\S]*?)(?<!`)`|((?:(?!```|`)[\s\S])+)/g, (match, p1, p2, p3, p4) => {
    if (p1) {
      const language = p1.match(/^([a-z]+)/i)?.[1];
      return `<pre><code class="language-${language}">${hljs.highlight(p2, { language }).value.replace(/\n/g, '<br>')}</code></pre>`;
    } else if (p2) {
      return `<pre><code class="language-plaintext">${hljs.highlightAuto(p2).value.replace(/\n/g, '<br>')}</code></pre>`;
    } else if (p3) {
      return `<code class="language-plaintext">${hljs.highlightAuto(p3).value}</code>`;
    } else {
      return `<p>${p4.replace(/\n/g, '<br>')}</p>`
    }
});

  messages.push({ role: 'assistant', content: answer });
  console.log(messages);

  responseContainer.innerHTML = [...messages].reverse()
    .map((message) => {
      const { role, content } = message;
      const cssClass = role === 'user' ? 'user-message' : 'assistant-message';
      return `<div class="${cssClass}"><strong>${role}: </strong>${content.replace(
        /```([a-zA-Z+]+)?\n([\s\S]*?)```|(?<!`)`([\s\S]*?)(?<!`)`|((?:(?!```|`)[\s\S])+)/g,
        (match, p1, p2, p3, p4) => {
          if (p1) {
            const language = p1.match(/^([a-z]+)/i)?.[1];
            return `<pre><code class="language-${language}">${hljs
              .highlight(p2, { language })
              .value.replace(/\n/g, '<br>')}</code></pre>`;
          } else if (p2) {
            return `<pre><code class="language-plaintext">${hljs
              .highlightAuto(p2)
              .value.replace(/\n/g, '<br>')}</code></pre>`;
          } else if (p3) {
            return `<code class="language-plaintext">${hljs
              .highlightAuto(p3)
              .value}</code>`;
          } else {
            return `<p>${p4.replace(/\n/g, '<br>')}</p>`;
          }
        }
      )}</div>`;
    })
    .join('');
 
}else {
 console.log("No answer from chatgpt");
}
  s.stop(`Response: ${answer}`);
  askButton.disabled = false;
  askButton.textContent = 'Ask';
});

// Apply modern design to the Ask button and response container
questionForm.style.display = 'flex';
questionForm.style.flexDirection = 'column';
questionForm.style.alignItems = 'center';
questionInput.style.width = '100%';
askButton.style.padding = '12px 16px';
askButton.style.backgroundColor = '#fff';
askButton.style.color = '#444';
askButton.style.borderRadius = '4px';

