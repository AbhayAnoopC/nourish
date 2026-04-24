import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const PHOTO_SYSTEM =
  'You are a food recognition assistant. Identify food items in meal photos and estimate portions and nutrition.';

const LABEL_SYSTEM =
  'You are a nutrition label parser. Extract structured data from photos of food labels.';

const PHOTO_PROMPT =
  'Identify all food items in this meal photo. For each estimate: foodName, servingSize (common units), calories, proteinG, carbsG, fatG. Add uncertain: true if not confident. Return only a JSON array, no other text.';

const LABEL_PROMPT =
  'Extract nutrition from this label. Return only a JSON object with: foodName, servingDescription, servingQuantity (the number in that description), caloriesPerServing, proteinGPerServing, carbsGPerServing, fatGPerServing. No other text.';

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as {
      type: 'photo' | 'label';
      imageBase64: string;
    };

    if (!body.type || !body.imageBase64) {
      return Response.json(
        { error: 'anthropic', message: 'Missing type or imageBase64' },
        { status: 400 },
      );
    }

    const isPhoto = body.type === 'photo';
    const systemText = isPhoto ? PHOTO_SYSTEM : LABEL_SYSTEM;
    const userPrompt = isPhoto ? PHOTO_PROMPT : LABEL_PROMPT;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: isPhoto ? 1024 : 512,
      system: [{ type: 'text' as const, text: systemText, cache_control: { type: 'ephemeral' as const } }],
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/jpeg', data: body.imageBase64 },
            },
            { type: 'text', text: userPrompt },
          ],
        },
      ],
    });

    const first = message.content[0];
    if (!first || first.type !== 'text') {
      return Response.json({ error: 'parse', message: 'Unexpected response format' }, { status: 422 });
    }

    const pattern = isPhoto ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
    const match = first.text.match(pattern);
    if (!match) {
      return Response.json({ error: 'parse', message: 'Could not extract JSON from response' }, { status: 422 });
    }

    const parsed: unknown = JSON.parse(match[0]);
    return isPhoto ? Response.json({ items: parsed }) : Response.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Scan failed';
    return Response.json({ error: 'anthropic', message }, { status: 500 });
  }
}
