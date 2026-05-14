export const jurisdictionEngine = {
  activeState: "Ohio",
  activeCounty: "Franklin",

  states: {
    Ohio: {
      label: "Ohio",
      transform: {
        x: 540,
        y: 330,
        scale: 1.55,
        originX: 545,
        originY: 350
      },
      path: `
        M520 315
        L548 307
        L584 305
        L605 323
        L607 352
        L598 381
        L570 392
        L540 390
        L520 372
        L514 344
        Z
      `,
      counties: {
        Franklin: {
          label: "Franklin County",
          participants: 23,
          badge: "active",
          path: `
            M556 343
            L569 341
            L575 350
            L572 363
            L559 365
            L551 355
            Z
          `,
          labelBox: {
            left: "58.7%",
            top: "56.4%"
          }
        }
      }
    },

    Texas: {
      label: "Texas",
      transform: {
        x: 500,
        y: 372,
        scale: 1.65,
        originX: 500,
        originY: 372
      },
      path: `
        M452 332
        L488 320
        L520 325
        L552 345
        L560 382
        L542 410
        L512 424
        L470 420
        L446 392
        L440 360
        Z
      `,
      counties: {
        Harris: {
          label: "Harris County",
          participants: 31,
          badge: "active",
          path: `
            M517 382
            L530 381
            L535 392
            L529 403
            L516 402
            L510 391
            Z
          `,
          labelBox: {
            left: "54.2%",
            top: "62.2%"
          }
        }
      }
    },

    Florida: {
      label: "Florida",
      transform: {
        x: 605,
        y: 410,
        scale: 1.45,
        originX: 605,
        originY: 410
      },
      path: `
        M586 360
        L604 354
        L620 366
        L628 390
        L624 420
        L614 450
        L600 470
        L588 462
        L592 432
        L598 402
        L588 380
        Z
      `,
      counties: {
        "Miami-Dade": {
          label: "Miami-Dade County",
          participants: 18,
          badge: "active",
          path: `
            M595 456
            L603 454
            L607 463
            L603 472
            L594 470
            L591 462
            Z
          `,
          labelBox: {
            left: "63.2%",
            top: "73.5%"
          }
        }
      }
    },

    "New York": {
      label: "New York",
      transform: {
        x: 640,
        y: 280,
        scale: 1.35,
        originX: 640,
        originY: 280
      },
      path: `
        M612 255
        L632 246
        L654 248
        L676 258
        L683 276
        L674 295
        L652 304
        L630 300
        L614 286
        L608 268
        Z
      `,
      counties: {
        Kings: {
          label: "Kings County",
          participants: 27,
          badge: "active",
          path: `
            M654 292
            L662 291
            L666 299
            L662 307
            L653 306
            L650 298
            Z
          `,
          labelBox: {
            left: "69.2%",
            top: "42.2%"
          }
        }
      }
    }
  },

  routes: {
    Ohio: [
      {
        d: "M578 350 Q 648 286 744 244",
        stroke: "rgba(255,184,107,0.72)",
        width: 2.2
      },
      {
        d: "M578 350 Q 490 285 382 250",
        stroke: "rgba(143,196,255,0.62)",
        width: 1.9
      },
      {
        d: "M578 350 Q 530 418 462 495",
        stroke: "rgba(143,196,255,0.50)",
        width: 1.8
      }
    ],
    Texas: [
      {
        d: "M522 392 Q 585 360 676 342",
        stroke: "rgba(255,184,107,0.72)",
        width: 2.2
      },
      {
        d: "M522 392 Q 450 340 360 300",
        stroke: "rgba(143,196,255,0.60)",
        width: 1.9
      }
    ],
    Florida: [
      {
        d: "M600 463 Q 650 408 716 350",
        stroke: "rgba(255,184,107,0.72)",
        width: 2.1
      }
    ],
    "New York": [
      {
        d: "M658 299 Q 700 286 760 265",
        stroke: "rgba(255,184,107,0.72)",
        width: 2.0
      },
      {
        d: "M658 299 Q 620 260 560 215",
        stroke: "rgba(143,196,255,0.56)",
        width: 1.8
      }
    ]
  }
};
