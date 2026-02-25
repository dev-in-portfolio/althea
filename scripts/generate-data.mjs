import fs from 'node:fs';
import path from 'node:path';

const wingsInput = [
  {
    name: 'Natural History Museums',
    halls: [
      'Origins of Earth Hall','Deep Time Hall','Evolution of Life Hall','Biodiversity Hall','Ecosystems of the World Hall','Ancient Oceans Hall','Ice Age & Climate History Hall','Human Origins Hall','Megafauna Hall','Extinction & Survival Hall','Adaptation & Survival Strategies Hall','Rainforest Worlds Hall','Desert Life Hall','Arctic & Polar Worlds Hall','Grasslands & Savannas Hall','Mountains & Highlands Hall','Insects & Micro-Fauna Hall','Birds & Flight in Nature Hall','Marine Life Hall','Freshwater Worlds Hall','Plant Diversity Hall','Fungi & Hidden Life Hall','Fossils & Ancient Life Hall','Natural Cycles & Seasons Hall','Predator & Prey Dynamics Hall','Migration & Movement Hall','Natural Selection & Adaptation Hall','Conservation & Threatened Species Hall','Human Impact on Nature Hall','Future of Biodiversity Hall'
    ]
  },
  {
    name: 'Space & Astronomy Museums',
    halls: [
      'Our Place in the Universe Hall','Solar System Hall','Planetary Worlds Hall','Moons & Ring Systems Hall','Stars & Stellar Life Cycles Hall','Birth of Stars Hall','Galaxies & Cosmic Structure Hall','The Milky Way Hall','Cosmology & Origins of the Universe Hall','Dark Matter & Dark Energy Hall','Black Holes & Extreme Physics Hall','Exoplanets & Search for Life Hall','Space Exploration History Hall','Human Spaceflight Hall','Robotic Exploration Hall','Living in Space Hall','Space Telescopes & Observation Hall','Light & Cosmic Radiation Hall','Asteroids, Comets & Impacts Hall','Space Weather Hall','Orbital Mechanics & Motion Hall','Rocketry & Propulsion Hall','Satellites & Global Systems Hall','Planetary Surfaces Hall','Mars & Future Exploration Hall','Colonizing Space Hall','Cosmic Time & Deep Time Hall','Extreme Environments in Space Hall','Future Space Technologies Hall','The Future of Humanity in Space Hall'
    ]
  },
  {
    name: 'Earth Science & Geology Museums',
    halls: [
      'Formation of Earth Hall','Plate Tectonics Hall','Volcanoes & Magma Hall','Earthquakes & Seismic Forces Hall','Mountain Building Hall','Rock Cycle Hall','Minerals & Earth Materials Hall','Fossils & Ancient Landscapes Hall','Geological Time Hall','Oceans & Seafloor Hall','Rivers & Erosion Hall','Weathering & Landscape Change Hall','Soil & Surface Systems Hall','Atmosphere & Air Systems Hall','Weather & Storm Systems Hall','Climate & Climate Change Hall','Ice & Glacial Processes Hall','Deserts & Arid Lands Hall','Caves & Underground Worlds Hall','Natural Resources Hall','Energy from the Earth Hall','Natural Hazards Hall','Water Cycle Hall','Coastal Systems Hall','Earth Observation & Mapping Hall','Earth Through Time Hall','Human Interaction with Earth Hall','Environmental Change Hall','Sustainability & Stewardship Hall','Future Earth Hall'
    ]
  },
  {
    name: 'Mineral & Gem Museums',
    halls: [
      'Crystal Formation Hall','Mineral Diversity Hall','Gemstones of the World Hall','Precious Stones Hall','Industrial Minerals Hall','Optical & Light-Reactive Minerals Hall','Crystal Structures Hall','Colors in Minerals Hall','Rare & Exotic Minerals Hall','Meteorite Minerals Hall','Formation Environments Hall','Pegmatites & Giant Crystals Hall','Fluorescent Minerals Hall','Minerals in Technology Hall','Gem Cutting & Faceting Hall','Historical Gems Hall','Cultural Significance of Gems Hall','Mineral Identification Hall','Mineral Hardness & Properties Hall','Birth of Gemstones Hall','Diamonds Hall','Gold & Precious Metals Hall','Ore & Mining Hall','Mining History Hall','Minerals in Everyday Life Hall','Synthetic & Lab-Grown Gems Hall','Preservation & Conservation Hall','Jewelry & Ornamentation Hall','Geological Origins of Gems Hall','Future Materials & Gem Science Hall'
    ]
  },
  {
    name: 'Paleontology Museums',
    halls: [
      'Fossil Formation Hall','Deep Time & Earth History Hall','Precambrian Life Hall','Cambrian Explosion Hall','Age of Fishes Hall','Age of Reptiles Hall','Dinosaur Worlds Hall','Marine Reptiles Hall','Flying Reptiles Hall','Early Mammals Hall','Ice Age Mammals Hall','Plant Fossils Hall','Ancient Forests Hall','Evolutionary Transitions Hall','Extinction Events Hall','Mass Extinctions Hall','Fossil Hunting & Fieldwork Hall','Fossil Preparation Hall','Trace Fossils & Footprints Hall','Ancient Ecosystems Hall','Predator & Prey in Deep Time Hall','Adaptations & Survival Hall','Paleoenvironment Reconstruction Hall','Climate Through Time Hall','Fossils & Modern Species Links Hall','Microfossils & Ancient Seas Hall','Amber & Preserved Life Hall','Human Evolution Fossils Hall','Dinosaurs in Culture & Science Hall','Future of Paleontology Hall'
    ]
  },
  {
    name: 'Botanical Science Museums / Gardens',
    halls: [
      'Plant Diversity Hall','Plant Anatomy & Structures Hall','Plant Life Cycles Hall','Seeds, Spores & Reproduction Hall','Photosynthesis & Energy Hall','Plant Genetics & Breeding Hall','Evolution of Plants Hall','Pollination & Coevolution Hall','Plant–Animal Relationships Hall','Plant Defense & Chemistry Hall','Medicinal Plants Hall','Useful Plants & Human Society Hall','Agriculture Origins Hall','Crop Science & Food Plants Hall','Trees & Forest Systems Hall','Tropical Plant Worlds Hall','Desert Plants & Adaptations Hall','Wetlands & Aquatic Plants Hall','Alpine & High-Altitude Plants Hall','Native Plants & Regional Ecology Hall','Invasive Species Hall','Conservation & Rare Plants Hall','Climate Change & Plants Hall','Soil, Roots & Mycorrhizae Hall','Plant Microbiomes Hall','Plant Growth & Hormones Hall','Botanical Exploration & Collecting Hall','Herbarium & Plant Records Hall','Horticulture & Cultivation Hall','Future Plants & Sustainability Hall'
    ]
  },
  {
    name: 'Marine Science & Oceanography Museums',
    halls: [
      'Ocean Realms Overview Hall','Coastal Systems Hall','Open Ocean (Pelagic) Hall','Deep Sea Hall','Coral Reefs Hall','Estuaries & Marshes Hall','Ocean Biodiversity Hall','Marine Food Webs Hall','Plankton & the Microscopic Ocean Hall','Marine Mammals Hall','Sharks & Predators Hall','Fish Diversity Hall','Invertebrate Worlds Hall','Ocean Currents & Circulation Hall','Waves, Tides & Coastal Dynamics Hall','Seafloor Geology Hall','Hydrothermal Vents Hall','Polar Oceans Hall','Ocean Chemistry Hall','Ocean–Atmosphere Connections Hall','Climate Change & Oceans Hall','Ocean Acoustics & Soundscapes Hall','Navigation & Ocean Mapping Hall','Submersibles & Ocean Technology Hall','Marine Research Methods Hall','Fisheries & Human Use Hall','Pollution & Plastics Hall','Conservation & Protected Seas Hall','Maritime Hazards & Safety Hall','Future Ocean Stewardship Hall'
    ]
  },
  {
    name: 'Biology & Life Sciences Museums',
    halls: [
      'What Is Life? Hall','Cells & Microscopic Life Hall','DNA, Genes & Heredity Hall','Evolution & Diversity Hall','Classification & Tree of Life Hall','Microbes & Microbiomes Hall','Viruses & Infectious Disease Hall','Immunity & Defense Hall','Human Biology Overview Hall','Organ Systems Hall','The Brain & Nervous System Hall','Senses & Perception Hall','Development & Growth Hall','Aging & Longevity Hall','Biomechanics & Movement Hall','Reproduction & Life Cycles Hall','Animal Behavior Hall','Ecology & Interdependence Hall','Ecosystems & Biomes Hall','Adaptation & Survival Hall','Symbiosis & Coevolution Hall','Plant Biology Hall','Animal Diversity Hall','Marine Biology Hall','Genetics in Society & Ethics Hall','Biotechnology & Bioengineering Hall','Conservation Biology Hall','One Health (Human/Animal/Environment) Hall','Frontiers in Life Science Hall','Future of Biology Hall'
    ]
  },
  {
    name: 'Physics Museums',
    halls: [
      'Motion & Forces Hall','Gravity & Orbits Hall','Energy & Work Hall','Momentum & Collisions Hall','Simple Machines & Mechanics Hall','Fluids & Pressure Hall','Waves & Vibrations Hall','Sound & Acoustics Hall','Light & Optics Hall','Color & Vision Hall','Electricity Basics Hall','Circuits & Electronics Hall','Magnetism Hall','Electromagnetism Hall','Heat & Thermodynamics Hall','States of Matter (Physical) Hall','Materials & Physical Properties Hall','Relativity & Spacetime Hall','Quantum Worlds Hall','Atomic & Molecular Physics Hall','Nuclear Physics Hall','Radiation & Detection Hall','Particle Physics Hall','The Standard Model Hall','Fields & Forces of Nature Hall','Measurement & Instruments Hall','Physics of Everyday Life Hall','Extreme Physics Hall','Experiment & Demo Theater Hall','Frontiers of Physics Hall'
    ]
  },
  {
    name: 'Chemistry Museums',
    halls: [
      'Matter & Molecules Hall','Elements & the Periodic Table Hall','Atomic Structure Hall','Chemical Bonding Hall','States of Matter (Chemical) Hall','Mixtures & Solutions Hall','Acids, Bases & pH Hall','Reactions & Energy Hall','Reaction Rates & Catalysts Hall','Equilibrium Hall','Oxidation, Reduction & Electrochemistry Hall','Gases & Atmosphere Chemistry Hall','Water Chemistry Hall','Carbon Chemistry & Organics Hall','Polymers & Plastics Hall','Materials & Everyday Chemistry Hall','Chemistry of Color & Light Hall','Chemistry of Smell & Taste Hall','Food Chemistry Hall','Medicinal & Pharmaceutical Chemistry Hall','Biochemistry Basics Hall','Environmental Chemistry Hall','Industrial Chemistry Hall','Green Chemistry Hall','Lab Methods & Safety Hall','Analytical Chemistry Hall','Molecular Modeling Hall','Chemistry Demo Theater Hall','Chemistry in the Home Hall','Chemistry Frontiers Hall'
    ]
  },
  {
    name: 'Materials Science Museums',
    halls: [
      'What Are Materials? Hall','Structure of Materials Hall','Crystals & Defects Hall','Metals & Alloys Hall','Ceramics & Glass Hall','Polymers & Elastomers Hall','Composites Hall','Biomaterials Hall','Electronic Materials Hall','Magnetic Materials Hall','Optical Materials Hall','Thermal Materials Hall','Mechanical Strength & Failure Hall','Fracture, Fatigue & Wear Hall','Corrosion & Protection Hall','Surface Science & Coatings Hall','Materials Processing Hall','Manufacturing & Fabrication Hall','3D Printing & Additive Manufacturing Hall','Smart Materials Hall','Shape Memory & Responsive Materials Hall','Energy Materials (Batteries/Fuel Cells) Hall','Semiconductor Basics Hall','Materials in Architecture Hall','Materials in Transportation Hall','Materials in Medicine Hall','Recycling & Circular Materials Hall','Testing & Characterization Hall','Materials Design & Simulation Hall','Future Materials Hall'
    ]
  },
  {
    name: 'Nanotechnology & Advanced Materials Centers',
    halls: [
      'Scale & the Nano World Hall','Seeing the Invisible (Microscopy) Hall','Nanostructures & Patterns Hall','Carbon Nanomaterials Hall','Nanoparticles & Colloids Hall','Nano in Nature Hall','Nanofabrication Hall','Cleanroom & Manufacturing Hall','Nanoelectronics Hall','Quantum Materials Hall','Photonics & Plasmonics Hall','Nanomedicine Hall','Drug Delivery & Diagnostics Hall','Biomimicry & Nano Design Hall','Nanochemistry Hall','Catalysis at the Nano Scale Hall','Coatings & Thin Films Hall','Advanced Composites Hall','Meta-Materials Hall','Superconductors & Extreme Materials Hall','Energy at the Nano Scale Hall','Sensors & Nanosystems Hall','Nano Robotics Concepts Hall','Safety, Risk & Regulation Hall','Ethics & Society Hall','Prototyping & Applications Hall','Consumer Products & Nano Hall','Environmental Nano Tech Hall','Frontier Research Showcase Hall','Future of Nano & Advanced Materials Hall'
    ]
  },
  {
    name: 'Robotics & Automation Museums',
    halls: [
      'What Is a Robot? Hall','Early Automation & Mechanical Wonders Hall','Industrial Robotics Hall','Robot Arms & Manipulation Hall','Sensors & Perception Hall','Vision Systems Hall','Motion Planning Hall','Control Systems Hall','Actuators & Motors Hall','Human–Robot Interaction Hall','Social Robots Hall','Service Robots Hall','Medical Robotics Hall','Warehouse & Logistics Automation Hall','Autonomous Vehicles Hall','Drones & Aerial Robotics Hall','Underwater Robotics Hall','Space Robotics Hall','Swarm Robotics Hall','AI for Robotics Hall','Machine Learning & Adaptation Hall','Safety & Reliability Hall','Ethics & Responsibility Hall','Robot Design Studio Hall','Build & Test Lab Hall','Coding & Algorithms Hall','Prosthetics & Exoskeletons Hall','Future of Work & Automation Hall','Futurist Robotics Showcase Hall','Robotics Playground / Demo Arena Hall'
    ]
  },
  {
    name: 'Mathematics Museums',
    halls: [
      'Numbers & Counting Hall','Patterns & Sequences Hall','Symmetry & Transformations Hall','Geometry Hall','Topology Hall','Fractals Hall','Chaos & Nonlinear Systems Hall','Probability Hall','Statistics & Data Hall','Graphs & Networks Hall','Logic & Reasoning Hall','Proof & Paradox Hall','Puzzles & Games Hall','Optimization Hall','Algorithms Hall','Cryptography Hall','Mathematical Modeling Hall','Math in Nature Hall','Math in Music Hall','Math in Art & Design Hall','Measurement & Scaling Hall','Mapping & Coordinates Hall','Infinity & Limits Hall','Dimensionality Hall','Calculus Concepts Hall','Discrete Math Hall','Applied Math Hall','Computing & Math Hall','Math History & Cultures Hall','Frontiers of Mathematics Hall'
    ]
  },
  {
    name: 'Archaeological Science Museums',
    halls: [
      'What Is Archaeology? Hall','Fieldwork & Excavation Hall','Stratigraphy & Site Layers Hall','Dating the Past Hall','Materials & Artifacts Hall','Ceramics & Pottery Science Hall','Stone Tools & Lithics Hall','Metals & Metallurgy Hall','Trade & Networks Hall','Ancient Food & Agriculture Hall','Ancient Water Systems Hall','Architecture & Built Environments Hall','Writing & Recordkeeping Hall','Burial Practices & Bioarchaeology Hall','Human Remains & Ethics Hall','Ancient Diseases & Health Hall','DNA & Ancient Genomics Hall','Isotopes & Mobility Hall','Conservation & Preservation Hall','Restoration Lab Hall','Remote Sensing & Mapping Hall','Underwater Archaeology Hall','Experimental Archaeology Hall','Cultural Heritage & Repatriation Hall','Ancient Climates & Environments Hall','Civilization Case Studies Hall','Everyday Life in the Past Hall','Conflict & Collapse Hall','Museums, Collections & Provenance Hall','Future of Archaeological Science Hall'
    ]
  }
];

const topics = [
  'Orientation','Foundations','Key Terms','Core Processes','Evidence and Methods','Observation and Measurement','Patterns and Trends','Systems and Feedbacks','Structures and Forms','Materials and Properties',
  'Energy and Change','Cycles and Flows','Time and Scale','Spatial Relationships','Forces and Interactions','Origins and Formation','Diversity and Classification','Adaptation and Function','Dynamics and Motion','Stability and Balance',
  'Environmental Context','Human Connections','Technology and Tools','Models and Simulations','Data and Uncertainty','Case Studies','Comparisons Across Regions','Historical Perspective','Future Directions','Ethics and Stewardship',
  'Field Techniques','Lab Techniques','Mapping and Visualization','Signal and Noise','Cause and Effect','Constraints and Tradeoffs','Risk and Resilience','Networks and Connectivity','Thresholds and Tipping Points','Design Principles',
  'Resource Use','Conservation Strategies','Innovation Pathways','Communication of Science','Interdisciplinary Links','Scale Transitions','Boundary Conditions','Classification Challenges','Competing Hypotheses','Evidence Quality',
  'Measurement Standards','Calibration and Error','Sampling Strategies','Proxy Evidence','Indicators and Signatures','Material Transformations','Transport and Movement','Interactions and Coupling','Feedback Loops','Temporal Resolution',
  'Spatial Resolution','Comparative Anatomy','Functional Morphology','Mechanisms and Models','Experimental Approaches','Natural Variability','Anomalies and Outliers','Case Comparisons','Global Patterns','Local Variability',
  'Drivers of Change','Limits and Extremes','Energy Budgets','System Inputs','System Outputs','Pathways and Path Dependence','Scaling Laws','Efficiency and Loss','Optimization Tradeoffs','Design Constraints',
  'Signals in the Record','Correlation vs Causation','Benchmark Examples','Representative Specimens','Index Concepts','Core Vocabulary','Key Discoveries','Milestones and Timelines','Challenges and Open Questions','Synthesis and Summary'
];

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const wings = wingsInput.map((w, wi) => ({
  slug: slugify(w.name),
  name: w.name,
  description: ''
}));

const halls = [];
const exhibits = [];

for (const wing of wingsInput) {
  const wingSlug = slugify(wing.name);
  for (const hallName of wing.halls) {
    const hallSlug = `${wingSlug}--${slugify(hallName)}`;
    halls.push({
      slug: hallSlug,
      name: hallName,
      wingSlug,
      description: ''
    });
    const hallCore = hallName.replace(/\s*Hall\s*$/i, '').trim();
    for (let i = 0; i < 100; i++) {
      const n = String(i + 1).padStart(3, '0');
      const topic = topics[i];
      const title = `${hallCore}: ${topic}`;
      exhibits.push({
        slug: `${hallSlug}-exhibit-${n}`,
        title,
        hallSlug,
        wingSlug
      });
    }
  }
}

const root = process.cwd();
fs.writeFileSync(path.join(root, 'data/wings.json'), JSON.stringify(wings, null, 2));
fs.writeFileSync(path.join(root, 'data/halls.json'), JSON.stringify(halls, null, 2));
fs.writeFileSync(path.join(root, 'data/exhibits.json'), JSON.stringify(exhibits, null, 2));

console.log('Generated:', { wings: wings.length, halls: halls.length, exhibits: exhibits.length });
