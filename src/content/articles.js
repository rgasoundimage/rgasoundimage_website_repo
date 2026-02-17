export const articles = {
    "fix-auditorium-echo": {
      title: "Fixing Echo in Large Auditoriums",
      intro:
        "Speech echo in auditoriums is usually caused by late reflections from walls and ceilings rather than insufficient speaker volume.",
  
      simple:
        "If people complain that speech sounds loud but unclear, the problem is reflections bouncing back to the audience. You need absorption, not louder speakers.",
  
      considerations: [
        "Large flat walls reflect mid frequencies strongly",
        "High ceilings create delayed reflections",
        "Improper speaker angles increase overlap"
      ],
  
      recommendations: [
        "Add absorption panels at first reflection points",
        "Aim speakers toward audience, not walls",
        "Reduce unnecessary amplifier gain"
      ],
  
      technical: [
        "Recommended RT60: 0.8 – 1.2 seconds",
        "Reflection delay tolerance: < 50 ms",
        "Speech clarity target STI: > 0.6"
      ]
    },
  
    "dolby-atmos-vs-7-1": {
      title: "Dolby Atmos vs 7.1 — What Actually Matters",
      intro:
        "The real difference between Atmos and 7.1 is coverage consistency, not just speaker count.",
  
      simple:
        "Atmos improves immersion because sound moves above you, not just around you.",
  
      considerations: [
        "Ceiling height determines Atmos effectiveness",
        "Room width affects surround spacing",
        "Calibration matters more than channel count"
      ],
  
      recommendations: [
        "Do not upgrade before fixing acoustics",
        "Ensure proper speaker alignment",
        "Use certified processors for tuning"
      ],
  
      technical: [
        "Atmos height angle: 30°–55°",
        "Surround SPL match ±2 dB",
        "Delay alignment < 10 ms"
      ]
    }
  };
  