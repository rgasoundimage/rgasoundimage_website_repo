export const articles = {
    "fix-auditorium-echo": {
      title: "Fixing Echo in Large Auditoriums",
      datePublished: "2026-05-01",
      dateModified: "2026-05-18",
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
  
    "stonewater-sr200": {
      title: "The Stonewater SR200: The Commercial Amplifier That Solves the Subwoofer Problem",
      datePublished: "2026-07-16",
      dateModified: "2026-07-16",
      image: "/insights/stonewater-sr200.jpeg",
      intro:
        "Walk into most cafés, gyms and mid-sized restaurants and you'll hear the same thing: full-range speakers being asked to do a job they were never designed for. The Stonewater SR200 was built to close that gap.",

      body: [
        { type: "heading", text: "The problem nobody budgets for" },
        {
          type: "paragraph",
          text: "The music has no weight. The manager pushes the volume up to compensate. The speakers start to strain. By 9 PM the room sounds harsh, the staff have a headache, and nobody can explain why the \"good\" speakers sound bad.",
        },
        {
          type: "paragraph",
          text: "The diagnosis is almost always the same. Small satellite speakers are being fed the full audio spectrum, including bass content their drivers physically cannot reproduce. That energy doesn't disappear — it gets converted into cone excursion, heat and distortion. You lose bass and clarity at the same time.",
        },
        {
          type: "paragraph",
          text: "The fix is a subwoofer. The reason it doesn't happen is cost. Once you decide to add low end, the traditional route is a separate active subwoofer, or a passive sub plus a dedicated sub amplifier plus an outboard crossover. Suddenly a straightforward installation has three more line items and the client says no.",
        },
        {
          type: "paragraph",
          text: "This is exactly the gap the Stonewater SR200 was built to close.",
        },

        { type: "heading", text: "What the SR200 actually is" },
        {
          type: "paragraph",
          text: "The SR200 is a high-power 2.1 channel integrated amplifier — a two-stage design that puts stereo satellite amplification, a dedicated bass amplifier, an active crossover and source selection into a single 2U rack chassis.",
        },
        {
          type: "callout",
          text: "System output: 60W + 60W + 120W @ 4 Ω / 30W + 30W + 60W @ 8 Ω",
        },
        {
          type: "table",
          rows: [
            ["Minimum impedance", "4 Ω"],
            ["Distortion", "≤ 0.5%"],
            ["S/N ratio", "≥ 80 dB"],
            ["Inputs", "USB / Aux / CD / Computer"],
            ["Mic inputs", "2"],
            ["Outputs", "Line Out, Subwoofer Out"],
            ["Dimensions", "482 (W) × 88 (H) × 340 (D) mm"],
            ["Net weight", "7.3 kg"],
          ],
        },
        {
          type: "list",
          items: [
            "2.1 channel operation with inbuilt active crossover",
            "Onboard USB player",
            "Stereo / Mono switch",
            "Line Out and Subwoofer Out",
            "Short circuit protection",
            "Overload protection",
            "Convection cooling — no fan, no fan noise, no dust intake",
            "Tamper-proof recessed controls",
            "Compatible with the Atom Pack",
          ],
        },

        { type: "heading", text: "Why the passive subwoofer output changes the maths" },
        {
          type: "paragraph",
          bold: "This is the headline.",
          text: "The SR200 has a built-in bass amplifier that drives a passive subwoofer directly — 120W at 4 Ω dedicated to the low end, on top of the stereo channels.",
        },
        {
          type: "paragraph",
          text: "Think about what that removes from the bill of materials:",
        },
        {
          type: "list",
          items: [
            "No separate subwoofer power amplifier",
            "No outboard active crossover",
            "No third rack space, no extra mains socket, no extra interconnects",
            "No active sub sitting in a corner needing its own power run and its own volume setting that someone will inevitably touch",
          ],
        },
        {
          type: "paragraph",
          text: "For an integrator, that's fewer failure points and a faster install. For the client, it's the difference between a system that has real low end and a system that doesn't — at a price they'll actually sign off on.",
        },
        {
          type: "paragraph",
          text: "Pair it with a Stonewater Impulse 150 passive subwoofer and you have a properly engineered 2.1 system out of one box. The driver and enclosure are matched, the crossover is already voiced for the pairing, and the whole thing behaves like a designed system rather than a collection of parts.",
        },

        { type: "heading", text: "The low-cut filter: the feature that does the real work" },
        {
          type: "paragraph",
          text: "Here's the part that gets overlooked, and it's arguably the most important thing in the box.",
        },
        {
          type: "paragraph",
          text: "Because the SR200 has an inbuilt active crossover, it doesn't just send bass to the subwoofer — it also removes bass from the satellite channels. That's the low-cut (high-pass) filter, and it is doing quiet, unglamorous work all night long.",
        },
        {
          type: "list",
          items: [
            { bold: "Distortion drops.", text: "A small full-range driver reproducing a 40 Hz kick drum is a driver at the limit of its excursion. Take that content away and the same driver stops fighting itself. Intermodulation distortion falls, and the midrange — where vocals live — cleans up dramatically." },
            { bold: "Effective headroom rises.", text: "Bass frequencies eat amplifier power. Filtering them out of the satellite channels means the 60W per side is spent on the frequencies those speakers are good at. The system plays louder before it sounds strained." },
            { bold: "Speakers last longer.", text: "Over-excursion is a leading cause of driver failure in commercial installs that run 12 hours a day, 7 days a week. Low-cut filtering is preventive maintenance you install once." },
            { bold: "The room sounds bigger, not louder.", text: "When bass comes from a properly loaded subwoofer instead of a struggling 5-inch cone, the perceived scale of the system increases without the SPL going up. Staff aren't shouting over it. Customers stay longer." },
          ],
        },
        {
          type: "paragraph",
          text: "This is why a well-designed 2.1 system with modest wattage routinely outperforms a higher-wattage stereo system in the same room. Filtering isn't a compromise. It's the design.",
        },

        { type: "heading", text: "Practical strengths for real installations" },
        {
          type: "list",
          items: [
            { bold: "Convection cooling.", text: "No fan means no fan noise in a quiet café at 3 PM, and no fan means no dust-clogged bearing failing in month eighteen. For an amplifier that sits in a cupboard behind the bar, this matters more than any spec on the sheet." },
            { bold: "Tamper-proof recessed controls.", text: "Anyone who has been called out to a \"the system is broken\" job only to find someone's elbow turned the bass knob to maximum will understand why this is a feature and not a detail. Set it, commission it, walk away." },
            { bold: "Two mic inputs.", text: "Announcements, a trainer's headset in a gym, karaoke on a Friday — without a separate mixer." },
            { bold: "Onboard USB player.", text: "No source device to buy, no laptop to babysit, no CD player to break. Load a drive, walk away." },
            { bold: "Line Out for expansion.", text: "When the client extends into the terrace next year, you have a clean feed to link an additional amplifier rather than rebuilding the rack." },
            { bold: "Stereo/Mono switch.", text: "For distributed installs where stereo imaging is meaningless and mono summing is the correct engineering answer." },
            { bold: "Short circuit and overload protection.", text: "Commercial spaces have speaker cables run by people who are not audio installers. Protection circuitry is not optional in that world." },
          ],
        },

        { type: "heading", text: "Where the SR200 belongs" },
        {
          type: "list",
          items: [
            { bold: "Restaurants —", text: "medium to large, where background music needs body without volume" },
            { bold: "Cafés and lounges —", text: "long operating hours, low noise floor, cooling that must stay silent" },
            { bold: "Gyms and fitness studios —", text: "where the low end is the product, and mic input for a trainer is essential" },
            { bold: "Pubs and bars —", text: "high hours, high abuse, needs protection and tamper-proofing" },
            { bold: "Retail —", text: "brand-appropriate sound with real low end without an active sub in the shop floor sightline" },
            { bold: "Salons and clinics —", text: "small footprint, single-box simplicity" },
          ],
        },

        { type: "heading", text: "Where it doesn't" },
        {
          type: "paragraph",
          text: "Honest guidance builds better systems than optimistic guidance:",
        },
        {
          type: "list",
          items: [
            { bold: "100V line distributed installs", text: "across many zones — look at the Stonewater DD500 or SMX series instead" },
            { bold: "Multi-zone with independent volume control", text: "— the Zone-4 or Zone-8 is the right tool" },
            { bold: "Large-format live sound or high-SPL nightclub", text: "— this is an installation amplifier, not a touring amplifier" },
            { bold: "More than one passive subwoofer", text: "— the bass stage is designed around a single sub" },
          ],
        },

        { type: "heading", text: "Our take" },
        {
          type: "paragraph",
          text: "We say this having specified, installed and serviced a lot of commercial audio: in its price band, we have not found another commercial amplifier that combines a dedicated passive subwoofer output, an inbuilt active crossover with low-cut filtering, dual mic inputs, USB playback, convection cooling and tamper-proof controls in a single 2U chassis.",
        },
        {
          type: "paragraph",
          text: "Competitors in this bracket typically make you choose. You get the stereo power but no sub output. Or you get the sub output but no crossover, so you're buying an outboard unit anyway. Or you get the features but with a fan and a plastic chassis that won't survive three years behind a bar.",
        },
        {
          type: "paragraph",
          text: "The SR200 doesn't ask you to choose. That's the whole point of it.",
        },

        { type: "heading", text: "Talk to us" },
        {
          type: "paragraph",
          text: "RGA Sound Image supplies and specifies Stonewater across commercial installations. If you're designing a system for a restaurant, gym, café or retail space and you're weighing whether the subwoofer stays in the budget, the SR200 is usually the answer that lets it stay. Get in touch for pricing, a system design, or a demo.",
        },
        { type: "note", text: "*Terms & conditions apply." },
      ],
    },

    "dolby-atmos-vs-7-1": {
      title: "Dolby Atmos vs 7.1 — What Actually Matters",
      datePublished: "2026-05-01",
      dateModified: "2026-05-18",
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
  
