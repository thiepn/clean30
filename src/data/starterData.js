const task = (id, title, duration = "", detail = "") => ({
  id,
  title,
  duration,
  detail,
  label: ""
});

export const starterDailyRuleItems = [
  task(
    "clear-visible-trash",
    "Clear visible trash",
    "2 min",
    "Throw away anything that is clearly ready to go."
  ),
  task(
    "return-dishes",
    "Return dishes to the kitchen",
    "2 min",
    "Bring cups, plates, and cutlery back to the kitchen."
  ),
  task(
    "put-away-loose-items",
    "Put away loose clothes or items",
    "3 min",
    "Return a few visible items to where they belong."
  ),
  task(
    "wipe-dirty-surface",
    "Wipe one visibly dirty surface",
    "3 min",
    "Choose the surface that needs attention most."
  )
];

export const starterRoutines = [
  {
    id: "minimal-reset",
    title: "5-Minute Reset",
    estimatedTime: "5 min",
    purpose: "Make the room feel noticeably better with a few quick tasks.",
    whenToUse: "Use when you only have a few minutes.",
    message: "",
    phases: [
      {
        id: "minimal-reset-tasks",
        title: "Tasks",
        tasks: [
          task("minimal-clear-trash", "Clear visible trash"),
          task("minimal-return-dishes", "Return dishes"),
          task("minimal-put-away-items", "Put away loose items"),
          task("minimal-wipe-surface", "Wipe one dirty surface")
        ]
      }
    ]
  },
  {
    id: "guest-reset",
    title: "15-Minute Tidy",
    estimatedTime: "15 min",
    purpose: "Handle the most visible clutter and mess without doing a full clean.",
    whenToUse: "Use for a quick everyday tidy.",
    message: "",
    phases: [
      {
        id: "quick-tidy-tasks",
        title: "Tasks",
        tasks: [
          task("tidy-clear-trash", "Clear visible trash"),
          task("tidy-return-dishes", "Return dishes"),
          task("tidy-put-away-clothes", "Put away loose clothes"),
          task("tidy-clear-surfaces", "Clear the main surfaces"),
          task("tidy-bathroom-wipe", "Wipe the bathroom sink"),
          task("tidy-busiest-floor", "Sweep or vacuum the busiest area")
        ]
      }
    ]
  },
  {
    id: "weekly-reset",
    title: "Weekly Clean",
    estimatedTime: "30-45 min",
    purpose: "Cover the main areas of the home in one manageable clean.",
    whenToUse: "Use once a week or whenever the home needs a fuller clean.",
    message: "",
    phases: [
      {
        id: "weekly-kitchen",
        title: "Kitchen",
        tasks: [
          task("weekly-clear-dishes", "Clear or wash dishes"),
          task("weekly-wipe-counters", "Wipe counters and the sink"),
          task("weekly-empty-kitchen-trash", "Empty the kitchen trash")
        ]
      },
      {
        id: "weekly-bathroom",
        title: "Bathroom",
        tasks: [
          task("weekly-clean-toilet", "Clean the toilet"),
          task("weekly-clean-sink", "Clean the sink and faucet"),
          task("weekly-wipe-mirror", "Wipe the mirror")
        ]
      },
      {
        id: "weekly-surfaces",
        title: "Surfaces",
        tasks: [
          task("weekly-put-away-items", "Put away loose items"),
          task("weekly-dust-surfaces", "Dust visible surfaces")
        ]
      },
      {
        id: "weekly-floors",
        title: "Floors",
        tasks: [
          task("weekly-vacuum", "Vacuum or sweep the floors"),
          task("weekly-mop", "Mop where needed")
        ]
      },
      {
        id: "weekly-finish",
        title: "Finish",
        tasks: [
          task("weekly-final-check", "Do a quick final check")
        ]
      }
    ]
  },
  {
    id: "monthly-deep-clean",
    title: "Deep Clean",
    estimatedTime: "60-90 min",
    purpose: "Clean areas that do not need attention every week.",
    whenToUse: "Use occasionally when you want a more thorough clean.",
    message: "",
    phases: [
      {
        id: "deep-kitchen",
        title: "Kitchen",
        tasks: [
          task("deep-kitchen-appliances", "Clean the outside of kitchen appliances"),
          task("deep-kitchen-cabinets", "Wipe cabinet fronts"),
          task("deep-kitchen-fridge", "Clean one refrigerator shelf or drawer")
        ]
      },
      {
        id: "deep-bathroom",
        title: "Bathroom",
        tasks: [
          task("deep-bathroom-shower", "Clean the shower or bath area"),
          task("deep-bathroom-details", "Wipe handles, edges, and less-used surfaces")
        ]
      },
      {
        id: "deep-surfaces",
        title: "Surfaces and corners",
        tasks: [
          task("deep-dust-high-low", "Dust higher and less-used surfaces"),
          task("deep-clean-corners", "Clean visible corners and edges")
        ]
      },
      {
        id: "deep-floors",
        title: "Floors",
        tasks: [
          task("deep-under-furniture", "Clean under movable furniture"),
          task("deep-floor-edges", "Clean floor edges and corners")
        ]
      },
      {
        id: "deep-glass",
        title: "Glass and mirrors",
        tasks: [
          task("deep-clean-glass", "Clean windows or glass surfaces that need attention"),
          task("deep-clean-mirrors", "Clean mirrors")
        ]
      }
    ]
  }
];

export const starterZones = [
  "Kitchen",
  "Bathroom",
  "Bedroom",
  "Living room",
  "Entrance",
  "Floors",
  "Other"
];

export const starterSystems = {
  apartmentLaws: [],
  bottlenecks: [],
  priorityOrder: [],
  systemSections: [
    {
      id: "starter-guidance",
      title: "Cleaning guidance",
      problem: "",
      items: [],
      secondaryTitle: "",
      secondaryItems: []
    }
  ]
};
