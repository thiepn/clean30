export const apartmentLaws = [
  "Trash leaves when full.",
  "Drying rack gets emptied before dishes.",
  "Dirty clothes only go in the laundry basket.",
  "Bathroom smell gets handled immediately.",
  "Entrance dirt gets vacuumed weekly."
];

export const bottlenecks = [
  {
    problem: "Drying rack stays full",
    consequence: "Dishes stop moving, sink fills"
  },
  {
    problem: "Laundry not scheduled",
    consequence: "Clothes spread across rooms"
  },
  {
    problem: "Trash not removed",
    consequence: "Smell, clutter, and mental resistance"
  },
  {
    problem: "Bathroom smell ignored",
    consequence: "Apartment feels unclean even if tidy"
  },
  {
    problem: "Floor dirt at entrance",
    consequence: "Dirt spreads into living room"
  },
  {
    problem: "Weekly cleaning depends on motivation",
    consequence: "Some weekends fail"
  }
];

export const priorityOrder = [
  {
    title: "Trash",
    detail: "Fastest visible improvement and smell control"
  },
  {
    title: "Dishes",
    detail: "Kitchen becomes usable"
  },
  {
    title: "Laundry/clothes",
    detail: "Removes most clutter"
  },
  {
    title: "Bathroom/toilet",
    detail: "Hygiene and smell"
  },
  {
    title: "Floors",
    detail: "Makes apartment feel clean"
  },
  {
    title: "Dust/windows",
    detail: "Maintenance, not emergency"
  },
  {
    title: "Organization",
    detail: "Only after dirt and clutter are removed"
  }
];

export const systemSections = [
  {
    id: "dishes",
    title: "Dishes System",
    problem: "Drying rack full -> sink fills -> dishes become annoying.",
    items: [
      "Empty drying rack.",
      "Wash dishes.",
      "Leave them drying.",
      "Next day, empty rack before adding more.",
      "When making coffee/tea or waiting for food, empty 5 items from the drying rack.",
      "Emergency limit: never let dishes exceed one full sink."
    ]
  },
  {
    id: "laundry",
    title: "Laundry System",
    problem: "Laundry is scheduled by triggers, not mood.",
    items: [
      "Do laundry when the basket is full.",
      "Do laundry when 7 days passed.",
      "Do laundry when towels or bedsheets need washing.",
      "Collect clothes.",
      "Start washer.",
      "Clean apartment while washer runs.",
      "Move to dryer.",
      "Remove from dryer.",
      "Fold immediately.",
      "Put away immediately.",
      "Critical rule: laundry is not done until put away."
    ]
  },
  {
    id: "bathroom-smell",
    title: "Bathroom Smell Protocol",
    problem: "Bathroom smell overrides how clean the apartment feels.",
    items: [
      "Clean inside bowl.",
      "Clean under rim.",
      "Wipe top and bottom of toilet seat.",
      "Wipe hinges.",
      "Wipe outer toilet bowl.",
      "Wipe toilet base.",
      "Wipe floor around toilet.",
      "Wipe nearby wall/tiles.",
      "Empty bathroom trash.",
      "Clean toilet brush holder.",
      "Replace towel/bathmat if smelly.",
      "Ventilate."
    ],
    secondaryTitle: "If smell remains",
    secondaryItems: [
      "Check urine around toilet base.",
      "Check toilet brush holder.",
      "Wash bathroom mat.",
      "Clean floor more thoroughly.",
      "Check drain smell.",
      "Persistent smell may be drain, ventilation, seal, or plumbing-related."
    ]
  },
  {
    id: "kitchen-mold",
    title: "Kitchen Mold Prevention",
    problem: "Wet + dark + ignored = mold.",
    items: [
      "After cooking/eating, wipe wet surfaces.",
      "Do not leave food waste open.",
      "Keep sink area dry.",
      "Ventilate briefly.",
      "Do not let wet cloths sit crumpled.",
      "Weekly check: sink edges, silicone joints, under sink, window frame, fridge seal, trash area, and corners behind appliances.",
      "Drying sink/counter after cleaning helps more than buying more cleaners."
    ]
  },
  {
    id: "windows-glass",
    title: "Windows And Glass",
    problem: "Window cleaning is maintenance, not a weekly anchor.",
    items: [
      "Do not make windows part of weekly cleaning.",
      "Wipe fingerprints weekly/as needed.",
      "Main living room glass inside monthly.",
      "All windows every 2-3 months.",
      "Balcony/outer side only when visibly bad."
    ]
  },
  {
    id: "supplies",
    title: "Practical Supplies",
    problem: "Supplies should reduce friction, not create a shopping project.",
    items: [
      "Small entrance mat reduces Erdgeschoss dirt.",
      "Second laundry basket separates dirty vs clean/rewear clothes.",
      "Small dish towel stack helps clear drying rack faster.",
      "Bathroom odor neutralizer only after actual cleaning is fixed.",
      "Small trash bin with lid helps food/bathroom smell.",
      "Warning: do not buy more cleaners. More products will not fix the system."
    ]
  }
];
