const task = (id, title, duration = "", detail = "", label = "") => ({
  id,
  title,
  duration,
  detail,
  label
});

export const dailyRuleItems = [
  task(
    "no-food-trash",
    "No food trash overnight",
    "1 min",
    "Throw away food packaging, remove food waste, and close trash properly."
  ),
  task(
    "dishes-returned",
    "Dishes returned to kitchen",
    "1 min",
    "Move dishes out of the living room or bedroom and back into the kitchen."
  ),
  task(
    "clothes-to-basket",
    "Clothes into laundry basket",
    "30 sec",
    "Dirty clothes go into the basket, not onto the chair, floor, or bed."
  ),
  task(
    "bathroom-smell-check",
    "Bathroom smell check",
    "1-2 min",
    "Quick visual check, flush properly, wipe obvious drops, and ventilate."
  )
];

export const routines = [
  {
    id: "initial-reset",
    title: "Initial Reset",
    estimatedTime: "2-3 hours",
    purpose: "Bring the apartment back to baseline without deep-cleaning everything.",
    whenToUse: "Use when the apartment is around 5/10 and needs restoration.",
    phases: [
      {
        id: "open-windows",
        title: "Open windows",
        tasks: [
          task("initial-open-living-window", "Open large living room window/door", "2 min"),
          task("initial-open-bathroom-window", "Open bathroom window if possible", "2 min"),
          task(
            "initial-window-purpose",
            "Remove stale smell and reduce bathroom/toilet smell buildup",
            "",
            "Ventilation starts before the reset work."
          )
        ]
      },
      {
        id: "trash-sweep",
        title: "Trash sweep",
        tasks: [
          task("initial-trash-bag-walk", "Take one trash bag and walk through every room", "15 min"),
          task("initial-trash-food-packaging", "Collect food packaging"),
          task("initial-trash-bottles-cans", "Collect bottles/cans"),
          task("initial-trash-tissues", "Collect tissues"),
          task("initial-trash-paper", "Collect random paper trash"),
          task("initial-trash-receipts", "Collect old receipts"),
          task("initial-trash-bathroom", "Collect bathroom trash"),
          task("initial-trash-kitchen", "Collect kitchen waste"),
          task("initial-trash-take-out", "Take trash out immediately", "", "", "Critical"),
          task(
            "initial-trash-warning",
            "Do not leave full bag near the door",
            "",
            "A staged trash bag is still a smell and clutter source.",
            "Warning"
          )
        ]
      },
      {
        id: "dishes-collection",
        title: "Dishes collection",
        tasks: [
          task("initial-dishes-living-room", "Collect dishes from living room", "10 min"),
          task("initial-dishes-bedroom", "Collect dishes from bedroom"),
          task("initial-dishes-desk", "Collect dishes from desk"),
          task("initial-dishes-kitchen", "Collect dishes from kitchen"),
          task("initial-dishes-bedside", "Collect dishes from bedside area"),
          task("initial-dishes-sink-zone", "Put all dishes next to the sink"),
          task(
            "initial-dishes-centralize-first",
            "Do not wash yet; centralize first",
            "",
            "A fixed sequence prevents wandering and half-starts.",
            "Sequence"
          )
        ]
      },
      {
        id: "clothes-collection",
        title: "Clothes collection",
        tasks: [
          task("initial-clothes-dirty", "Put clearly dirty clothes into laundry basket", "10 min"),
          task("initial-clothes-rewear", "Put worn-once usable clothes into rewear pile"),
          task("initial-clothes-clean", "Put clean clothes lying around into put-away pile"),
          task(
            "initial-clothes-unsure",
            "If unsure whether clean, treat as dirty",
            "",
            "Do not spend reset energy auditing clothing history.",
            "Rule"
          )
        ]
      },
      {
        id: "start-laundry",
        title: "Start laundry",
        tasks: [
          task("initial-laundry-downstairs", "Bring laundry downstairs", "10 min"),
          task("initial-laundry-start-washer", "Start washing machine"),
          task("initial-laundry-set-timer", "Set phone timer"),
          task("initial-laundry-clean-while-running", "Clean upstairs while washer runs")
        ]
      },
      {
        id: "empty-drying-rack",
        title: "Empty drying rack",
        tasks: [
          task("initial-rack-empty", "Empty drying rack before washing dishes", "5 min", "", "Critical"),
          task("initial-rack-cupboard", "Put dry dishes back into cupboard"),
          task("initial-rack-principle", "Wash, dry, return to cupboard", "", "The rack must keep moving.")
        ]
      },
      {
        id: "wash-dishes",
        title: "Wash dishes",
        tasks: [
          task("initial-wash-glasses", "Wash cups/glasses first", "20-30 min"),
          task("initial-wash-cutlery", "Wash cutlery"),
          task("initial-wash-plates", "Wash plates/bowls"),
          task("initial-wash-pots", "Wash pots/pans"),
          task("initial-wash-sink", "Wipe sink"),
          task("initial-wash-counter", "Wipe counter"),
          task("initial-wash-residue", "Throw away food residue"),
          task(
            "initial-wash-not-perfect",
            "Do not try to make kitchen perfect yet",
            "",
            "Control the bottleneck first.",
            "Focus"
          )
        ]
      },
      {
        id: "bathroom-reset",
        title: "Bathroom reset",
        tasks: [
          task("initial-bathroom-cleaner", "Put toilet cleaner under rim", "25-35 min"),
          task("initial-bathroom-sit", "Let cleaner sit while cleaning surfaces"),
          task("initial-bathroom-seat-top-bottom", "Wipe toilet seat top and bottom"),
          task("initial-bathroom-lid", "Wipe toilet lid"),
          task("initial-bathroom-rim", "Wipe toilet rim"),
          task("initial-bathroom-flush-button", "Wipe flush button"),
          task("initial-bathroom-outside-bowl", "Wipe outside of toilet bowl"),
          task("initial-bathroom-floor-around", "Wipe floor around toilet"),
          task("initial-bathroom-wall-tiles", "Wipe wall/tiles near toilet if smell persists"),
          task("initial-bathroom-scrub", "Scrub inside toilet"),
          task("initial-bathroom-flush", "Flush"),
          task("initial-bathroom-floor-again", "Wipe floor around toilet again"),
          task("initial-bathroom-sink", "Clean sink"),
          task("initial-bathroom-faucet", "Clean faucet"),
          task("initial-bathroom-mirror", "Clean mirror"),
          task("initial-bathroom-shower", "Clean shower/bath area if visibly dirty"),
          task("initial-bathroom-trash", "Empty bathroom trash"),
          task("initial-bathroom-towel", "Replace or wash towel if needed"),
          task("initial-bathroom-bathmat", "Wash bathmat if it smells"),
          task("initial-bathroom-brush-holder", "Check toilet brush holder")
        ]
      },
      {
        id: "kitchen-mold-check",
        title: "Kitchen mold check",
        tasks: [
          task("initial-mold-sink", "Check around sink", "10-15 min"),
          task("initial-mold-silicone", "Check silicone edges"),
          task("initial-mold-wall-behind-sink", "Check wall behind sink"),
          task("initial-mold-under-sink", "Check under sink"),
          task("initial-mold-trash-area", "Check behind trash area"),
          task("initial-mold-window-frame", "Check window frame"),
          task("initial-mold-fridge-seal", "Check fridge seal"),
          task("initial-mold-damp-corners", "Check damp corners"),
          task(
            "initial-mold-visible",
            "If mold is visible, wear gloves, ventilate, clean with suitable cleaner, dry thoroughly, remove moisture source",
            "",
            "Clean safely and fix moisture, not just the visible spot.",
            "Warning"
          ),
          task("initial-mold-prevention", "Kitchen surfaces must be dry before leaving them")
        ]
      },
      {
        id: "dust",
        title: "Dust",
        tasks: [
          task("initial-dust-shelves", "Dust shelves", "15-20 min"),
          task("initial-dust-desk-table", "Dust desk/table"),
          task("initial-dust-windowsills", "Dust windowsills"),
          task("initial-dust-drawer-tops", "Dust drawer tops"),
          task("initial-dust-electronics", "Dust electronics surfaces"),
          task("initial-dust-bedside", "Dust bedside area"),
          task("initial-dust-microfiber", "Use microfiber cloth"),
          task("initial-dust-not-tiny-objects", "Do not dust every tiny object individually during reset")
        ]
      },
      {
        id: "vacuum",
        title: "Vacuum",
        tasks: [
          task("initial-vacuum-bedroom", "Vacuum bedroom", "15-20 min"),
          task("initial-vacuum-living-room", "Vacuum living room"),
          task("initial-vacuum-kitchen", "Vacuum kitchen"),
          task("initial-vacuum-bathroom", "Vacuum bathroom"),
          task("initial-vacuum-entrance-last", "Vacuum entrance/corridor last"),
          task("initial-vacuum-entrance-zone", "Focus entrance dirt zone"),
          task("initial-vacuum-under-desk", "Focus under desk/table"),
          task("initial-vacuum-near-bed", "Focus near bed"),
          task("initial-vacuum-kitchen-floor", "Focus kitchen floor"),
          task("initial-vacuum-bathroom-floor", "Focus bathroom floor")
        ]
      },
      {
        id: "mop",
        title: "Mop",
        tasks: [
          task("initial-mop-bedroom", "Mop bedroom", "10-15 min"),
          task("initial-mop-living-room", "Mop living room"),
          task("initial-mop-kitchen", "Mop kitchen"),
          task("initial-mop-bathroom", "Mop bathroom"),
          task("initial-mop-entrance-last", "Mop entrance last"),
          task("initial-mop-swiffer", "Use 2-3 Swiffer sheets"),
          task("initial-mop-entrance-dirtiest", "Entrance last because it is dirtiest")
        ]
      },
      {
        id: "laundry-transfer",
        title: "Laundry transfer",
        tasks: [
          task("initial-laundry-transfer", "Move laundry to dryer", "5-10 min"),
          task("initial-laundry-start-dryer", "Start dryer"),
          task("initial-laundry-no-wet-sit", "Do not let wet laundry sit", "", "", "Critical")
        ]
      },
      {
        id: "final-guest-reset",
        title: "Final 10-minute guest reset",
        tasks: [
          task("initial-final-clear-surfaces", "Clear visible surfaces"),
          task("initial-final-random-items", "Put random items into correct places"),
          task("initial-final-trash", "Take out remaining trash"),
          task("initial-final-close-cabinets", "Close cabinets/drawers"),
          task("initial-final-clothes", "Put dirty towels/clothes into laundry basket"),
          task("initial-final-bathroom-spray", "Spray bathroom lightly if needed"),
          task("initial-final-ventilate", "Ventilate for 5 minutes")
        ]
      }
    ]
  },
  {
    id: "weekly-reset",
    title: "Weekly Reset",
    estimatedTime: "90-120 minutes",
    purpose: "Main weekly routine, ideally tied to laundry.",
    whenToUse: "Saturday morning or early afternoon. Backup: Sunday evening minimum reset.",
    phases: [
      {
        id: "start",
        title: "Start",
        tasks: [
          task("weekly-open-windows", "Open windows"),
          task("weekly-collect-laundry", "Collect laundry"),
          task("weekly-start-washer", "Start washing machine"),
          task("weekly-set-timer", "Set timer")
        ]
      },
      {
        id: "trash",
        title: "Trash",
        tasks: [
          task("weekly-empty-kitchen-trash", "Empty kitchen trash"),
          task("weekly-trash-empty-bathroom", "Empty bathroom trash"),
          task("weekly-collect-living-trash", "Collect living room trash"),
          task("weekly-collect-bedroom-trash", "Collect bedroom trash"),
          task("weekly-remove-bottles-cans", "Remove bottles/cans"),
          task("weekly-trash-outside", "Take trash outside immediately", "", "", "Critical")
        ]
      },
      {
        id: "dishes",
        title: "Dishes",
        tasks: [
          task("weekly-empty-drying-rack", "Empty drying rack first", "", "", "Critical"),
          task("weekly-dishes-living-room", "Collect dishes from living room"),
          task("weekly-dishes-bedroom", "Collect dishes from bedroom"),
          task("weekly-wash-dishes", "Wash dishes"),
          task("weekly-wipe-sink", "Wipe sink"),
          task("weekly-wipe-counter", "Wipe counter"),
          task("weekly-rack-orderly", "Leave drying rack orderly"),
          task("weekly-rack-rule", "Drying rack must be empty before next dish session", "", "", "Rule")
        ]
      },
      {
        id: "bathroom",
        title: "Bathroom",
        tasks: [
          task("weekly-toilet-cleaner", "Put toilet cleaner inside bowl"),
          task("weekly-toilet-seat", "Wipe toilet seat"),
          task("weekly-toilet-hinges", "Wipe toilet hinges"),
          task("weekly-toilet-rim", "Wipe toilet rim"),
          task("weekly-toilet-lid", "Wipe toilet lid"),
          task("weekly-flush-button", "Wipe flush button"),
          task("weekly-outside-toilet", "Wipe outside toilet"),
          task("weekly-floor-around-toilet", "Wipe floor around toilet"),
          task("weekly-clean-sink", "Clean sink"),
          task("weekly-wipe-faucet", "Wipe faucet"),
          task("weekly-clean-mirror", "Clean mirror"),
          task("weekly-bathroom-empty-trash", "Empty bathroom trash"),
          task("weekly-replace-towel", "Replace towel"),
          task("weekly-ventilate-bathroom", "Ventilate"),
          task("weekly-mop-bathroom", "Quick mop bathroom floor")
        ]
      },
      {
        id: "kitchen",
        title: "Kitchen",
        tasks: [
          task("weekly-kitchen-counter", "Wipe counter"),
          task("weekly-kitchen-sink", "Wipe sink"),
          task("weekly-kitchen-stove", "Wipe stove/hob"),
          task("weekly-kitchen-fridge-food", "Check fridge for old food"),
          task("weekly-kitchen-mold-corners", "Check mold-prone corners"),
          task("weekly-kitchen-dry-areas", "Dry wet areas"),
          task("weekly-kitchen-food-waste", "Take out food waste/trash")
        ]
      },
      {
        id: "bedroom",
        title: "Bedroom",
        tasks: [
          task("weekly-bedroom-dirty-clothes", "Put dirty clothes into laundry"),
          task("weekly-bedroom-clean-clothes", "Put clean clothes away"),
          task("weekly-bedroom-bedside", "Clear bedside area"),
          task("weekly-bedroom-dust", "Dust surfaces"),
          task("weekly-bedroom-vacuum", "Vacuum floor"),
          task("weekly-bedroom-bedsheets", "Change bedsheets if scheduled")
        ]
      },
      {
        id: "living-room",
        title: "Living room",
        tasks: [
          task("weekly-living-dishes", "Remove dishes/cups"),
          task("weekly-living-table", "Clear desk/table"),
          task("weekly-living-items-back", "Put random items back"),
          task("weekly-living-dust-shelves", "Dust shelves/drawers"),
          task("weekly-living-windowsills", "Dust windowsills"),
          task("weekly-living-vacuum", "Vacuum floor"),
          task("weekly-living-mop-if-needed", "Mop floor if needed")
        ]
      },
      {
        id: "entrance-corridor",
        title: "Entrance/corridor",
        tasks: [
          task("weekly-entrance-mat", "Shake/wipe entrance mat if present"),
          task("weekly-entrance-vacuum", "Vacuum entrance dirt"),
          task("weekly-entrance-mop-last", "Mop entrance last"),
          task("weekly-entrance-shoes", "Keep shoes contained")
        ]
      },
      {
        id: "laundry-finish",
        title: "Laundry finish",
        tasks: [
          task("weekly-laundry-move-dryer", "Move laundry to dryer"),
          task("weekly-laundry-remove-dryer", "Remove laundry from dryer"),
          task("weekly-laundry-fold", "Fold clothes immediately"),
          task("weekly-laundry-put-away", "Put clothes away immediately"),
          task("weekly-laundry-done-rule", "Laundry is not done until put away", "", "", "Critical")
        ]
      },
      {
        id: "final-check",
        title: "Final check",
        tasks: [
          task("weekly-final-trash-gone", "Confirm trash gone"),
          task("weekly-final-dishes-controlled", "Confirm dishes controlled"),
          task("weekly-final-bathroom-smell", "Confirm bathroom does not smell"),
          task("weekly-final-floor-clean", "Confirm floor clean"),
          task("weekly-final-living-guest-ready", "Confirm living room guest-ready"),
          task("weekly-final-windows", "Confirm windows closed/tilted properly")
        ]
      }
    ]
  },
  {
    id: "minimal-reset",
    title: "Minimal Reset",
    estimatedTime: "30-45 minutes",
    purpose: "Prevent apartment collapse when tired, busy, or lazy.",
    whenToUse: "Use as the Sunday backup or whenever a full reset is unrealistic.",
    message: "Do not skip cleaning entirely. Do this minimum version.",
    phases: [
      {
        id: "minimum-line",
        title: "Minimum line",
        tasks: [
          task("minimal-trash-out", "Take trash out", "5 min"),
          task("minimal-drying-rack", "Empty drying rack", "5 min"),
          task("minimal-visible-dishes", "Wash visible dishes", "15 min"),
          task("minimal-clothes-basket", "Put clothes into laundry basket", "5 min"),
          task("minimal-clean-toilet", "Clean toilet", "5 min"),
          task("minimal-bathroom-sink", "Clean bathroom sink", "5 min"),
          task("minimal-vacuum-entrance-living", "Vacuum entrance and living room", "5 min"),
          task("minimal-open-window", "Open window for 5 minutes")
        ]
      }
    ]
  },
  {
    id: "daily-rules",
    title: "Daily Rules",
    estimatedTime: "Maximum 5 minutes",
    purpose: "Daily Rules, not daily cleaning.",
    whenToUse: "Use every day to stop the main bottlenecks from growing.",
    phases: [
      {
        id: "daily-maintenance",
        title: "Daily maintenance",
        tasks: dailyRuleItems
      }
    ]
  },
  {
    id: "guest-reset",
    title: "Guest Reset",
    estimatedTime: "10 minutes",
    purpose: "When girlfriend/friends come over spontaneously.",
    whenToUse: "Use when someone is coming over soon.",
    message: "This is damage control. Real cleaning happens weekly.",
    phases: [
      {
        id: "minute-0-2-trash",
        title: "Minute 0-2: Trash",
        tasks: [
          task("guest-trash-visible", "Collect visible trash"),
          task("guest-trash-bag", "Throw into bag"),
          task("guest-trash-close", "Close trash")
        ]
      },
      {
        id: "minute-2-4-dishes",
        title: "Minute 2-4: Dishes",
        tasks: [
          task("guest-dishes-kitchen", "Move all dishes to kitchen"),
          task("guest-dishes-stack", "Stack neatly or put into sink")
        ]
      },
      {
        id: "minute-4-6-clothes",
        title: "Minute 4-6: Clothes",
        tasks: [
          task("guest-clothes-dirty", "Dirty clothes into laundry basket"),
          task("guest-clothes-clean", "Clean clothes into one temporary basket/chair corner")
        ]
      },
      {
        id: "minute-6-8-bathroom",
        title: "Minute 6-8: Bathroom",
        tasks: [
          task("guest-bathroom-seat", "Wipe toilet seat"),
          task("guest-bathroom-sink", "Wipe sink"),
          task("guest-bathroom-towel", "Replace towel if needed"),
          task("guest-bathroom-spray", "Spray/ventilate")
        ]
      },
      {
        id: "minute-8-10-living-room",
        title: "Minute 8-10: Living room",
        tasks: [
          task("guest-living-table", "Clear table"),
          task("guest-living-straighten", "Straighten cushions/chair"),
          task("guest-living-window", "Open window briefly"),
          task("guest-bedroom-door", "Close bedroom door if bedroom is messy")
        ]
      }
    ]
  },
  {
    id: "monthly-deep-clean",
    title: "Monthly Deep Clean",
    estimatedTime: "1-2 hours",
    purpose: "Monthly maintenance only. Do not make this weekly.",
    whenToUse: "Use every 30 days or when monthly maintenance has drifted.",
    phases: [
      {
        id: "monthly-maintenance",
        title: "Monthly maintenance",
        tasks: [
          task("monthly-windows-glass", "Clean windows/glass more thoroughly"),
          task("monthly-baseboards", "Wipe baseboards if dirty"),
          task("monthly-behind-under-bed", "Clean behind/under bed"),
          task("monthly-under-furniture", "Clean under sofa/table/desk"),
          task("monthly-declutter-drawer", "Declutter one drawer/shelf"),
          task("monthly-fridge-interior", "Clean fridge interior"),
          task("monthly-kitchen-mold-zones", "Check kitchen mold zones"),
          task("monthly-wash-bathmat", "Wash bathmat"),
          task("monthly-shower-drain", "Clean shower drain"),
          task("monthly-doors-handles-switches", "Wipe doors/handles/light switches"),
          task("monthly-supplies-review", "Review cleaning supplies")
        ]
      },
      {
        id: "window-glass-schedule",
        title: "Window/glass schedule",
        tasks: [
          task("monthly-glass-door-fingerprints", "Wipe fingerprints on glass door weekly or as needed"),
          task("monthly-living-glass-inside", "Clean main living room glass inside monthly"),
          task("monthly-all-windows", "Clean all windows properly every 2-3 months"),
          task("monthly-balcony-glass", "Balcony glass/outer side only when visibly bad"),
          task("monthly-do-not-weekly", "Do not clean all windows weekly", "", "", "Rule")
        ]
      }
    ]
  }
];
