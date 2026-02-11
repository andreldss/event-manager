export async function apiFetch(url: string, method: string, body?: any) {
    const response = await fetch(`http://localhost:3001${url}`, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', 
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const errorData = await response.json();

        throw new Error(
        typeof errorData.message === 'string' ? errorData.message : 'Erro na requisição.');
    }

    return response.json();
}
