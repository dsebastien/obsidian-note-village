# Village Generation Alternatives

## Goal

Create a **memory palace** where spatial location of notes (villagers) is stable over time, supporting knowledge management and learning through spatial memory.

## Current Approach

Uses **most-used tags** to create zones and select notes. This works but may not be optimal for memory palace effectiveness.

---

## 40 Alternative Approaches

### Category 1: Graph-Based (Relationship-Driven)

1. **Link Gravity**
    - Notes with more backlinks become central landmarks
    - Highly-connected hub notes form plazas/monuments
    - Creates natural "importance topology" reflecting actual knowledge structure

2. **Community Detection**
    - Use graph algorithms (Louvain, modularity) to find natural clusters
    - Each cluster becomes a district
    - Reflects emergent knowledge domains rather than imposed tags

3. **Bridge Notes as Crossroads**
    - Notes connecting otherwise separate clusters become intersections/plazas
    - These are cognitively important "gateway" concepts
    - Natural wayfinding landmarks

4. **Link Distance Neighborhoods**
    - Pick anchor notes (MOCs, index notes)
    - 1 link away = inner ring, 2 links = middle ring, etc.
    - Creates concentric knowledge zones

5. **Orphan Outskirts**
    - Unlinked notes form the village outskirts/wilderness
    - Visual incentive to integrate orphan notes
    - Center = well-connected, edges = isolated

6. **Bidirectional Link Strength**
    - Notes with mutual links are neighbors
    - One-way links create "facing" relationships
    - Reflects knowledge reciprocity

7. **Link Type Zoning**
    - Different link types (references, extends, contradicts) create different relationships
    - "Extends" links = same street, "contradicts" = opposite side
    - Semantic link meaning becomes spatial meaning

---

### Category 2: Temporal (Time-Based)

8. **Chronological Districts**
    - "Ancient quarter" for oldest notes, "new construction" for recent
    - Walking through village = walking through intellectual history
    - Strong autobiographical memory hook

9. **Creation Rhythm Zones**
    - Group by time-of-day created
    - Morning thoughts district, late-night ideas quarter
    - Taps into circadian memory patterns

10. **Edit Recency Gradient**
    - Active/evolving notes in vibrant center, dormant notes in quiet outskirts
    - Village "breathes" with attention patterns
    - Positions stay stable, activity varies

11. **Seasonal Quarters**
    - Notes grouped by season of creation
    - Spring = new beginnings, Winter = reflective content
    - Cyclical memory palace with yearly rhythm

12. **Project Timeline Streets**
    - Notes from same project period form a street
    - Walking a street = reliving a project's evolution
    - Strong episodic memory encoding

13. **Knowledge Epochs**
    - Major life/learning phases become distinct regions
    - "College years," "Career change," "Hobby deep-dive"
    - User-defined temporal boundaries

14. **First vs. Revised**
    - Original creation location stays fixed
    - Heavy revision activity shown through visual indicators
    - Preserves "where I first learned this" memory

---

### Category 3: Semantic (Content-Driven)

15. **Embedding Clusters**
    - Use semantic embeddings to cluster notes by meaning
    - Similar concepts naturally neighbor each other
    - No explicit links or tags required

16. **Question → Answer Proximity**
    - Notes containing questions near notes that answer them
    - Creates natural "dialogue" neighborhoods
    - Strong for Socratic learning

17. **Atomic Concept Anchors**
    - Identify core concepts (entities, ideas mentioned across notes)
    - Each concept becomes a landmark
    - Notes cluster around concepts they discuss

18. **Sentiment Terrain**
    - Positive/aspirational content in sunny highlands
    - Challenging/difficult topics in valleys
    - Emotional geography aids recall

19. **Abstraction Altitude**
    - Concrete, specific notes at ground level
    - Abstract, theoretical notes at higher elevations
    - Literal height = conceptual height

20. **Domain Continents**
    - NLP-detected domains become landmasses
    - Cross-domain notes are coastal/bridge areas
    - Geographic metaphor for knowledge breadth

21. **Keyword Neighborhoods**
    - Extract significant keywords per note
    - Notes sharing rare keywords become neighbors
    - More specific than tags, automatically derived

---

### Category 4: Zettelkasten/PKM-Specific

22. **Note Maturity Zones**
    - Fleeting notes on outskirts (shantytown)
    - Literature notes in suburbs
    - Permanent/evergreen notes in prestigious center
    - Visualizes knowledge refinement journey

23. **Sequence Streets**
    - Main Zettelkasten sequences become main streets
    - Branch notes form side streets
    - Preserves original Luhmann spatial metaphor

24. **MOC Hubs**
    - Maps of Content become town squares
    - Notes linked from MOC surround their square
    - Multiple MOCs = multiple plazas

25. **Source Attribution Districts**
    - Notes from same source (book, course, person) cluster together
    - "Author neighborhoods" or "course campuses"
    - Traces knowledge provenance

26. **Progressive Summarization Layers**
    - Notes with more highlighting/bolding in center
    - Raw captures on edges
    - Reflects processing depth

27. **Idea Lifecycle Paths**
    - Capture → Process → Connect → Create as a journey
    - Notes at different stages occupy different zones
    - Village shows knowledge workflow

---

### Category 5: Learning-Optimized

28. **Spaced Repetition Integration**
    - Notes due for review have "awake" villagers
    - Recently reviewed notes are "resting"
    - Creates urgency cues, maintains spatial stability

29. **Knowledge Gap Lots**
    - Empty lots = identified gaps (linked but uncreated notes)
    - Village shows what you know AND should learn
    - Visual learning roadmap

30. **Bloom's Taxonomy Terrain**
    - Lower-level knowledge (facts) in lowlands
    - Higher-order synthesis on hills
    - Literal elevation = cognitive elevation

31. **Confidence Coloring**
    - User-rated confidence affects visual presentation
    - Uncertain knowledge visually distinct
    - Identifies areas needing reinforcement

32. **Teaching Readiness Zones**
    - Notes you could teach others in "academy" district
    - Notes still being learned in "student" quarters
    - Feynman technique visualization

33. **Dependency Chains**
    - Prerequisite notes must be "passed" to reach advanced notes
    - Creates natural learning paths through village
    - Gamified progression

---

### Category 6: Structural (Folder/Metadata)

34. **Folder Geography**
    - Folders become continents/islands
    - Preserves existing mental model
    - Cross-folder links become bridges

35. **PARA Districts**
    - Projects (active worksite)
    - Areas (residential)
    - Resources (library district)
    - Archives (historical quarter)

36. **Property-Based Zoning**
    - Frontmatter properties determine placement
    - `type: person` → residential
    - `type: concept` → academy district
    - Deterministic and user-controlled

37. **File Size Architecture**
    - Longer notes = larger buildings
    - Short notes = small houses
    - Creates visual "content density" skyline

38. **Alias/Name Clustering**
    - Notes with similar titles neighbor each other
    - Alphabetical streets within semantic districts
    - Easy to find "where would X be?"

---

### Category 7: User-Defined/Personalized

39. **User-Defined Compass**
    - Users assign semantic meaning to directions
    - "North = technical, South = creative, East = work, West = personal"
    - Every position encodes multiple dimensions
    - Highly personalizable memory palace

40. **Manual Pinning with Auto-Fill**
    - Users pin important "landmark" notes manually
    - Algorithm fills in remaining notes relative to pins
    - Combines user intent with automated organization

---

## Evaluation Criteria

When selecting an approach, consider:

| Criterion           | Description                                          |
| ------------------- | ---------------------------------------------------- |
| **Stability**       | Do positions remain consistent across regenerations? |
| **Meaningfulness**  | Does position encode useful information?             |
| **Memorability**    | Does spatial layout aid recall?                      |
| **Scalability**     | Does it work with 100 notes? 10,000 notes?           |
| **Computation**     | Can it run quickly on plugin load?                   |
| **User Control**    | Can users influence/override the algorithm?          |
| **Discoverability** | Does it surface forgotten or orphan notes?           |

---

## Recommended Hybrid Approach

Combine multiple dimensions:

1. **Primary axis**: Graph-based clustering (link gravity + community detection)
2. **Secondary axis**: Temporal or maturity gradient
3. **Landmarks**: High-connectivity notes as fixed reference points
4. **User overrides**: Manual pinning for personally important notes
5. **Visual layers**: Maturity, recency, confidence as visual indicators (not position)

This creates a village where:

- Similar ideas are near each other (semantic coherence)
- Your intellectual journey is visible (temporal depth)
- Important concepts are unmissable (landmark stability)
- Personal meaning is preserved (user control)

---

## Implementation Considerations

### Quick Wins (Low Effort)

- Folder Geography (#34)
- Property-Based Zoning (#36)
- Chronological Districts (#8)
- Link Gravity (#1)

### Medium Effort

- Community Detection (#2)
- MOC Hubs (#24)
- Note Maturity Zones (#22)
- Knowledge Gap Lots (#29)

### Higher Effort (May Need External Services)

- Embedding Clusters (#15)
- Semantic Analysis (#18, #19, #20)
- Spaced Repetition Integration (#28)

---

## Next Steps

1. **User Decision**: Which approach(es) resonate most?
2. **Prototype**: Implement 1-2 approaches to test
3. **Evaluate**: Test with real vault, gather feedback
4. **Iterate**: Refine based on memory palace effectiveness

---

## Open Questions

- Should users be able to switch between organization modes?
- How to handle notes that fit multiple categories?
- What's the right balance between stability and responsiveness to change?
- Should positions be persisted or calculated fresh each time?
