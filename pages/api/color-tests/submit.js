// Proxy to backend Color Test submission with conversion from colorAssociations + colorRankings
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { colorAssociations, colorRankings, userId } = req.body || {};
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    if (!colorAssociations || typeof colorAssociations !== 'object') {
      return res.status(400).json({ error: 'colorAssociations are required' });
    }

    // Fetch inputs to know available colors/concepts and their order
    const baseUrl =
      typeof window === 'undefined'
        ? process.env.INTERNAL_API_URL
        : process.env.NEXT_PUBLIC_API_URL;
    const backendUrl = baseUrl || 'http://localhost:8000';

    const inputsResp = await fetch(`${backendUrl}/color-tests/inputs`);
    if (!inputsResp.ok) {
      const text = await inputsResp.text();
      return res
        .status(inputsResp.status)
        .json({ error: 'Failed to load inputs from backend', details: text });
    }
    const inputs = await inputsResp.json();
    const colors = inputs.colors || [];
    const concepts = inputs.concepts || [];

    if (!Array.isArray(colors) || colors.length === 0) {
      return res.status(500).json({ error: 'Backend returned empty colors' });
    }
    if (!Array.isArray(concepts) || concepts.length === 0) {
      return res.status(500).json({ error: 'Backend returned empty concepts' });
    }

    // Validate rankings: ensure all colors are present
    const rankings = Array.isArray(colorRankings) ? colorRankings : [];
    const normalizedRankings = rankings.map((c) => String(c));
    const missingColors = colors.filter((c) => !normalizedRankings.includes(c));
    const extraColors = normalizedRankings.filter((c) => !colors.includes(c));

    if (extraColors.length) {
      return res.status(400).json({ error: `Unknown colors in ranking: ${extraColors.join(', ')}` });
    }
    const orderedColors = [...normalizedRankings, ...missingColors];

    if (orderedColors.length !== colors.length) {
      return res
        .status(400)
        .json({ error: 'Color ranking is incomplete. Rank all colors from inputs.' });
    }

    // Build concept_color_matrix: columns follow orderedColors; each column holds concepts assigned that color
    const colorToConcepts = new Map(colors.map((c) => [c, []]));
    Object.entries(colorAssociations).forEach(([concept, color]) => {
      if (!colors.includes(color)) {
        throw new Error(`Concept "${concept}" has unsupported color "${color}"`);
      }
      const arr = colorToConcepts.get(color);
      arr.push(concept);
    });

    // Validate concepts coverage
    const assignedConcepts = Array.from(colorToConcepts.values()).flat();
    const missingConcepts = concepts.filter((c) => !assignedConcepts.includes(c));
    const extraConcepts = assignedConcepts.filter((c) => !concepts.includes(c));
    if (missingConcepts.length) {
      return res
        .status(400)
        .json({ error: `Not all concepts assigned a color: ${missingConcepts.join(', ')}` });
    }
    if (extraConcepts.length) {
      return res
        .status(400)
        .json({ error: `Unknown concepts present: ${extraConcepts.join(', ')}` });
    }

    const concept_color_matrix = orderedColors.map((color) => colorToConcepts.get(color) || []);

    const response = await fetch(`${backendUrl}/color-tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        color_test_solution: { concept_color_matrix },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: 'Backend error', details: text });
    }

    const data = await response.json();
    return res.status(201).json(data);
  } catch (error) {
    console.error('Error submitting color test:', error);
    return res.status(500).json({ error: 'Internal error', details: error.message });
  }
}
