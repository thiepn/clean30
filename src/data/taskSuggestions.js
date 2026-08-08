export const cleaningTaskCatalog = [
  { title: "Clear visible trash", room: "Whole home", minutes: 2, stage: 10, keywords: ["trash", "rubbish", "garbage"] },
  { title: "Return dishes to the kitchen", room: "Whole home", minutes: 2, stage: 20, keywords: ["dishes", "cups", "plates"] },
  { title: "Put away loose items", room: "Whole home", minutes: 4, stage: 30, keywords: ["clutter", "tidy", "items"] },
  { title: "Gather dirty laundry", room: "Whole home", minutes: 3, stage: 20, keywords: ["laundry", "clothes"] },
  { title: "Dust visible surfaces", room: "Whole home", minutes: 5, stage: 40, keywords: ["dust", "surfaces"] },
  { title: "Vacuum main floors", room: "Whole home", minutes: 10, stage: 70, keywords: ["vacuum", "hoover", "floors"] },
  { title: "Mop hard floors", room: "Whole home", minutes: 10, stage: 80, keywords: ["mop", "floors"] },
  { title: "Open windows and air out the home", room: "Whole home", minutes: 2, stage: 5, keywords: ["air", "ventilate", "windows"] },

  { title: "Clear or wash dishes", room: "Kitchen", minutes: 8, stage: 20, keywords: ["dishes", "sink"] },
  { title: "Wipe kitchen counters", room: "Kitchen", minutes: 4, stage: 50, keywords: ["counter", "worktop", "surface"] },
  { title: "Clean the kitchen sink", room: "Kitchen", minutes: 4, stage: 50, keywords: ["sink", "faucet", "tap"] },
  { title: "Clean the stovetop", room: "Kitchen", minutes: 6, stage: 50, keywords: ["stove", "hob", "cooktop"] },
  { title: "Wipe cabinet fronts", room: "Kitchen", minutes: 7, stage: 50, keywords: ["cabinet", "cupboard"] },
  { title: "Wipe appliance fronts", room: "Kitchen", minutes: 5, stage: 50, keywords: ["appliance", "fridge", "oven"] },
  { title: "Clean the microwave", room: "Kitchen", minutes: 5, stage: 50, keywords: ["microwave"] },
  { title: "Clean one refrigerator shelf", room: "Kitchen", minutes: 6, stage: 50, keywords: ["fridge", "refrigerator"] },
  { title: "Empty the kitchen bin", room: "Kitchen", minutes: 3, stage: 10, keywords: ["trash", "bin", "garbage"] },
  { title: "Sweep or vacuum the kitchen floor", room: "Kitchen", minutes: 5, stage: 70, keywords: ["vacuum", "sweep", "floor"] },
  { title: "Mop the kitchen floor", room: "Kitchen", minutes: 6, stage: 80, keywords: ["mop", "floor"] },

  { title: "Clean the toilet", room: "Bathroom", minutes: 6, stage: 50, keywords: ["toilet", "wc"] },
  { title: "Clean the bathroom sink", room: "Bathroom", minutes: 4, stage: 50, keywords: ["sink", "faucet", "tap"] },
  { title: "Clean the bathroom mirror", room: "Bathroom", minutes: 3, stage: 60, keywords: ["mirror", "glass"] },
  { title: "Clean the shower or bath", room: "Bathroom", minutes: 10, stage: 50, keywords: ["shower", "bath", "tub"] },
  { title: "Wipe bathroom surfaces", room: "Bathroom", minutes: 5, stage: 50, keywords: ["surface", "shelf"] },
  { title: "Replace bathroom towels", room: "Bathroom", minutes: 2, stage: 90, keywords: ["towel"] },
  { title: "Empty the bathroom bin", room: "Bathroom", minutes: 2, stage: 10, keywords: ["trash", "bin"] },
  { title: "Vacuum or sweep the bathroom floor", room: "Bathroom", minutes: 4, stage: 70, keywords: ["vacuum", "sweep", "floor"] },
  { title: "Mop the bathroom floor", room: "Bathroom", minutes: 5, stage: 80, keywords: ["mop", "floor"] },

  { title: "Make the bed", room: "Bedroom", minutes: 2, stage: 30, keywords: ["bed", "bedding"] },
  { title: "Change the bedding", room: "Bedroom", minutes: 8, stage: 30, keywords: ["bed", "sheets", "bedding"] },
  { title: "Put away clothes", room: "Bedroom", minutes: 5, stage: 30, keywords: ["clothes", "wardrobe"] },
  { title: "Clear bedside surfaces", room: "Bedroom", minutes: 3, stage: 30, keywords: ["bedside", "clutter"] },
  { title: "Dust bedroom furniture", room: "Bedroom", minutes: 5, stage: 40, keywords: ["dust", "furniture"] },
  { title: "Clean the bedroom mirror", room: "Bedroom", minutes: 3, stage: 60, keywords: ["mirror", "glass"] },
  { title: "Vacuum the bedroom", room: "Bedroom", minutes: 7, stage: 70, keywords: ["vacuum", "floor"] },
  { title: "Clean under the bed", room: "Bedroom", minutes: 8, stage: 70, keywords: ["bed", "under", "vacuum"] },

  { title: "Clear the coffee table", room: "Living room", minutes: 3, stage: 30, keywords: ["table", "clutter"] },
  { title: "Put away living-room clutter", room: "Living room", minutes: 5, stage: 30, keywords: ["clutter", "tidy"] },
  { title: "Dust living-room surfaces", room: "Living room", minutes: 6, stage: 40, keywords: ["dust", "surface"] },
  { title: "Wipe electronics", room: "Living room", minutes: 4, stage: 50, keywords: ["tv", "electronics", "screen"] },
  { title: "Straighten cushions and blankets", room: "Living room", minutes: 2, stage: 30, keywords: ["cushion", "sofa", "blanket"] },
  { title: "Vacuum the sofa", room: "Living room", minutes: 6, stage: 70, keywords: ["sofa", "couch", "vacuum"] },
  { title: "Vacuum the living room", room: "Living room", minutes: 8, stage: 70, keywords: ["vacuum", "floor"] },
  { title: "Mop the living-room floor", room: "Living room", minutes: 7, stage: 80, keywords: ["mop", "floor"] },

  { title: "Put shoes away", room: "Entrance", minutes: 3, stage: 30, keywords: ["shoes", "entrance", "hall"] },
  { title: "Clear the entrance surface", room: "Entrance", minutes: 3, stage: 30, keywords: ["entrance", "hall", "clutter"] },
  { title: "Wipe the front door area", room: "Entrance", minutes: 4, stage: 50, keywords: ["door", "entrance"] },
  { title: "Vacuum or sweep the entrance", room: "Entrance", minutes: 5, stage: 70, keywords: ["vacuum", "sweep", "entrance"] },
  { title: "Mop the entrance floor", room: "Entrance", minutes: 5, stage: 80, keywords: ["mop", "entrance"] },

  { title: "Clean interior windows", room: "Other", minutes: 12, stage: 60, keywords: ["window", "glass"] },
  { title: "Dust window sills", room: "Other", minutes: 4, stage: 40, keywords: ["window", "dust"] },
  { title: "Wipe light switches and handles", room: "Other", minutes: 5, stage: 50, keywords: ["switch", "handle", "door"] },
  { title: "Clean skirting boards", room: "Other", minutes: 10, stage: 60, keywords: ["baseboard", "skirting"] },
  { title: "Dust high surfaces", room: "Other", minutes: 8, stage: 40, keywords: ["dust", "high"] }
];

export const routineStarterTemplates = [
  {
    id: "quick-reset",
    title: "Quick reset",
    description: "A fast visible-mess reset.",
    sections: {
      "Tasks": [
        "Clear visible trash",
        "Return dishes to the kitchen",
        "Put away loose items",
        "Wipe kitchen counters"
      ]
    }
  },
  {
    id: "bathroom-clean",
    title: "Bathroom clean",
    description: "A practical bathroom checklist.",
    sections: {
      "Bathroom": [
        "Clean the toilet",
        "Clean the bathroom sink",
        "Clean the bathroom mirror",
        "Clean the shower or bath",
        "Empty the bathroom bin",
        "Mop the bathroom floor"
      ]
    }
  },
  {
    id: "kitchen-clean",
    title: "Kitchen clean",
    description: "Reset dishes, surfaces, appliances, and floor.",
    sections: {
      "Kitchen": [
        "Clear or wash dishes",
        "Empty the kitchen bin",
        "Wipe kitchen counters",
        "Clean the kitchen sink",
        "Clean the stovetop",
        "Wipe appliance fronts",
        "Sweep or vacuum the kitchen floor",
        "Mop the kitchen floor"
      ]
    }
  },
  {
    id: "whole-home-clean",
    title: "Whole-home clean",
    description: "A sensible room-by-room general clean.",
    sections: {
      "Whole home": [
        "Clear visible trash",
        "Return dishes to the kitchen",
        "Gather dirty laundry",
        "Put away loose items"
      ],
      "Kitchen": [
        "Clear or wash dishes",
        "Wipe kitchen counters",
        "Clean the kitchen sink"
      ],
      "Bathroom": [
        "Clean the toilet",
        "Clean the bathroom sink",
        "Clean the bathroom mirror"
      ],
      "Finish": [
        "Dust visible surfaces",
        "Vacuum main floors",
        "Mop hard floors"
      ]
    }
  }
];

export const suggestionRooms = [
  "All",
  "Whole home",
  "Kitchen",
  "Bathroom",
  "Bedroom",
  "Living room",
  "Entrance",
  "Other"
];
