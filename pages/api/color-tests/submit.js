// Proxy to backend Color Test submission with conversion from colorAssociations + colorRankings
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { colorAssociations, colorRankings, userId, name, demographics, email, chat_id } =
      req.body || {};
    if (!userId && !name) {
      return res.status(400).json({ error: 'userId is required' });
    }
    if (!colorAssociations || typeof colorAssociations !== 'object') {
      return res.status(400).json({ error: 'colorAssociations are required' });
    }

    const normalizeList = (items) => {
      if (!Array.isArray(items)) return [];
      return items
        .map((item) => {
          if (typeof item === 'string') return item;
          if (typeof item === 'number') return String(item);
          if (item && typeof item === 'object') {
            if (typeof item.name === 'string') return item.name;
            if (typeof item.label === 'string') return item.label;
            if (typeof item.value === 'string') return item.value;
          }
          return '';
        })
        .filter(Boolean);
    };

    const normalizeString = (value) => {
      if (typeof value === 'string') return value;
      if (typeof value === 'number') return String(value);
      if (value && typeof value === 'object') {
        if (typeof value.name === 'string') return value.name;
        if (typeof value.label === 'string') return value.label;
        if (typeof value.value === 'string') return value.value;
      }
      return '';
    };

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
    const colors = normalizeList(inputs?.colors);
    const concepts = normalizeList(inputs?.concepts);

    if (!Array.isArray(colors) || colors.length === 0) {
      return res.status(500).json({ error: 'Backend returned empty colors' });
    }
    if (!Array.isArray(concepts) || concepts.length === 0) {
      return res.status(500).json({ error: 'Backend returned empty concepts' });
    }

    // Validate rankings: ensure all colors are present
    const rankings = Array.isArray(colorRankings) ? colorRankings : [];
    const normalizedRankings = normalizeList(rankings);
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
      const normalizedConcept = normalizeString(concept);
      const normalizedColor = normalizeString(color);
      if (!colors.includes(normalizedColor)) {
        throw new Error(
          `Concept "${normalizedConcept || concept}" has unsupported color "${normalizedColor || color}"`
        );
      }
      const arr = colorToConcepts.get(normalizedColor);
      arr.push(normalizedConcept || concept);
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

    const submitColorTest = async (resolvedUserId) =>
      fetch(`${backendUrl}/color-tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: resolvedUserId,
          color_test_solution: { concept_color_matrix },
        }),
      });

    const parseBackendError = async (resp) => {
      const text = await resp.text();
      try {
        const parsed = JSON.parse(text);
        return { text, detail: parsed?.detail || parsed?.error || parsed?.details };
      } catch (err) {
        return { text, detail: text };
      }
    };

    let resolvedUserId = userId;
    if (!resolvedUserId && name) {
      const userResp = await fetch(`${backendUrl}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: email || null,
          demographics: demographics || null,
          chat_id: chat_id || null,
        }),
      });
      if (!userResp.ok) {
        const userError = await parseBackendError(userResp);
        return res.status(userResp.status).json({
          error: 'Backend user creation failed',
          details: userError.detail || userError.text,
        });
      }
      const createdUser = await userResp.json();
      resolvedUserId = createdUser?.id;
      if (!resolvedUserId) {
        return res
          .status(500)
          .json({ error: 'Backend user creation failed', details: 'Missing user id' });
      }
    }

    let response = await submitColorTest(resolvedUserId);
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        color_test_solution: { concept_color_matrix },
      }),
    });

    if (!response.ok) {
      const backendError = await parseBackendError(response);
      const isUserMissing =
        response.status === 404 &&
        backendError.detail &&
        String(backendError.detail).toLowerCase().includes('user not found');

      if (isUserMissing && name) {
        const userResp = await fetch(`${backendUrl}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email: email || null,
            demographics: demographics || null,
            chat_id: chat_id || null,
          }),
        });
        if (userResp.ok) {
          const createdUser = await userResp.json();
          const resolvedUserId = createdUser?.id;
          if (!resolvedUserId) {
            return res
              .status(500)
              .json({ error: 'Backend user creation failed', details: 'Missing user id' });
          }
          response = await submitColorTest(resolvedUserId);
          if (!response.ok) {
            const retryError = await parseBackendError(response);
            return res
              .status(response.status)
              .json({ error: 'Backend error', details: retryError.detail || retryError.text });
          }
        } else {
          const userError = await parseBackendError(userResp);
          return res.status(userResp.status).json({
            error: 'Backend user creation failed',
            details: userError.detail || userError.text,
          });
        }
      } else {
        return res
          .status(response.status)
          .json({ error: 'Backend error', details: backendError.detail || backendError.text });
      }
    }

    const data = await response.json();
    return res.status(201).json(data);
  } catch (error) {
    console.error('Error submitting color test:', error);
    return res.status(500).json({ error: 'Internal error', details: error.message });
  }
}
