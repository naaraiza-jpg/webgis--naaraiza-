Markdown
## Lab 03: Cool Corridors with JavaScript
### Naji Araiza


## What moved

The route information and route cards were moved from the HTML file into JavaScript. The JavaScript now creates all five route cards automatically using route objects. The HTML contains an empty container where the cards are displayed.

## Mark's four requests

The route cards are now created with JavaScript instead of manually writing each card in HTML.

A new route called Rio Salado Path was added.

Walking, biking, and driving travel times are calculated and displayed for each route.

Shade percentages are now explained using readable categories such as High shade, Moderate shade, Low shade, and Very low shade.

## Return

The routeCard() function creates and returns an article containing the route information. If it only logged the article instead of returning it, drawRoutes() would receive nothing to append, and the route cards would not appear on the page. 