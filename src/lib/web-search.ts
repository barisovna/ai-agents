export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

export async function searchWeb(query: string): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return 'Веб-поиск не настроен. Добавьте TAVILY_API_KEY в переменные окружения.';
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: 5,
        include_answer: true,
        search_depth: 'basic',
      }),
    });

    if (!response.ok) {
      return `Ошибка поиска: ${response.status}`;
    }

    const data = await response.json();

    let text = '';

    if (data.answer) {
      text += `**Краткий ответ:** ${data.answer}\n\n`;
    }

    text += '**Источники:**\n\n';

    for (const result of data.results ?? []) {
      text += `### ${result.title}\n`;
      text += `${result.url}\n`;
      text += `${result.content}\n\n`;
    }

    return text;
  } catch (error) {
    console.error('Web search error:', error);
    return 'Не удалось выполнить веб-поиск. Проверьте подключение.';
  }
}
