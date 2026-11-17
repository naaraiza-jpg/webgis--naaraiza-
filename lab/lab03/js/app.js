
const libraryLoop = {
    name: "Library Loop",
    miles: 1.4,
    shade: 62,
    description: "Tempe Transportation Center to Tempe Public Library along the Southern Avenue tree line."
};

console.table(libraryLoop);

const routes = [
    libraryLoop,
    {
        name: "Apache Line",
        miles: 1.1,
        shade: 38,
        description: "Streetcar stops on Apache Boulevard to Escalante Community Center. The long gap is by the car lots."
    },
    {
        name: "Mill Avenue Walk",
        miles: 0.9,
        shade: 71,
        description: "Tempe Beach Park to the downtown stops. Awnings do most of the work here."
    },
    {
        name: "McClintock Crossing",
        miles: 1.6,
        shade: 29,
        description: "The McClintock and Southern stop to Kiwanis Recreation Center. Our hottest route and the one we most want fixed."
    },
    {
        name: "Rio Salado Path",
        miles: 2.1,
        shade: 48,
        description: "Rio Salado Parkway path from the light rail bridge to the Tempe Marketplace cooling station."
    }
];

console.log(routes.length);
console.log(routes[0].name);
console.log(routes[4].name);

for (const route of routes) {
    console.log(route.name);
}

console.table(routes);

function minutesFor(miles, mph) {
    return Math.round((miles / mph) * 60);
}

function speedFor(mode) {
    if (mode === "walk") {
        return 3;
    } else if (mode === "bike") {
        return 10;
    } else if (mode === "drive") {
        return 25;
    } else {
        return 3;
    }
}

function routeCard(route, mode) {
    const article = document.createElement("article");
    article.className = "card";

    const heading = document.createElement("h3");
    heading.textContent = route.name;

    const facts = document.createElement("p");
   facts.textContent = `${route.miles} miles — ${route.shade}% shade (${shadeRating(route.shade)})`;

    const description = document.createElement("p");
    description.textContent = route.description;

    const time = document.createElement("p");
    time.className = "time";
    time.textContent = `${mode.charAt(0).toUpperCase() + mode.slice(1)}: ${minutesFor(route.miles, speedFor(mode))} min`;

    article.append(heading, facts, description, time);

    return article;
}

function drawRoutes(mode) {
    const container = document.querySelector(".routes");

    container.innerHTML = "";

    for (const route of routes) {
        container.append(routeCard(route, mode));
    }
}

drawRoutes("walk");

const buttons = document.querySelectorAll("[data-mode]");

for (const button of buttons) {
    button.addEventListener("click", function () {
        const mode = button.dataset.mode;
        drawRoutes(mode);
    });
}

function shadeRating(pct) {
  if (pct >= 60) {
    return "High shade";
  } else if (pct >= 30) {
    return "Moderate shade";
  } else {
    return "Low shade";
  }
}

