
-- Exercise 1 Question 1
SELECT COUNT(*)
FROM cooling_centers
WHERE city ILIKE 'Phoenix'
AND kind ILIKE '%hydration%';

-- Exercise 1 Question 2
SELECT name
FROM cooling_centers
WHERE city ILIKE 'Mesa'
AND pets ILIKE 'Yes'
ORDER BY name;

-- Exercise 1 Question 3
SELECT name
FROM cooling_centers
WHERE city ILIKE 'Scottsdale'
ORDER BY name ASC;

-- Exercise 1 Question 4
SELECT COUNT(*)
FROM cooling_centers
WHERE city ILIKE 'Tempe';


-- Exercise 2 Question 1
SELECT c.name AS city, COUNT(r.*) AS station_count
FROM cities c
LEFT JOIN rail_stations r
ON ST_Within(r.geom, c.geom)
GROUP BY c.name
ORDER BY station_count DESC;

-- Exercise 2 Question 2
SELECT cc.name AS site_name, c.name AS city, c.pop_2020 AS population
FROM cooling_centers cc
JOIN cities c ON cc.city ILIKE c.name
WHERE c.pop_2020 < 50000
ORDER BY c.pop_2020 ASC;

-- Exercise 2 Question 3
SELECT DISTINCT c.name AS city
FROM cities c
JOIN cooling_centers cc ON cc.city ILIKE c.name
WHERE c.county ILIKE '%Maricopa%'
AND cc.kind ILIKE '%library%'
ORDER BY c.name ASC;

-- Exercise 2 Question 4
SELECT AVG(c.pop_2020) AS average_population
FROM cities c
WHERE EXISTS (
    SELECT 1
    FROM cooling_centers cc
    WHERE cc.city ILIKE c.name
);


-- Exercise 3 Question 1
SELECT COUNT(DISTINCT cc.name) AS hydration_station_count
FROM cooling_centers cc
JOIN rail_stations rs
ON ST_DWithin(cc.geom::geography, rs.geom::geography, 400)
WHERE cc.kind ILIKE '%hydration%'
AND rs.service ILIKE '%light rail%';

-- Exercise 3 Question 2
SELECT COUNT(*) AS streetcar_station_count,
       STRING_AGG(DISTINCT city, ', ' ORDER BY city) AS cities
FROM rail_stations
WHERE service = 'StreetCar';

-- Exercise 3 Question 3
SELECT rs.name AS station_name,
       ST_Distance(rs.geom::geography, cc.geom::geography) AS distance_meters
FROM rail_stations rs
CROSS JOIN cooling_centers cc
WHERE cc.name ILIKE '%Burton Barr Central Library%'
ORDER BY ST_Distance(rs.geom::geography, cc.geom::geography)
LIMIT 1;

-- Exercise 3 Question 4
SELECT
    (
        SELECT COUNT(*)
        FROM cooling_centers cc
        JOIN cities c ON c.name = 'Mesa'
        WHERE ST_Within(cc.geom, c.geom)
    ) AS sites_inside_mesa_polygon,
    (
        SELECT COUNT(*)
        FROM cooling_centers
        WHERE city ILIKE 'Mesa'
    ) AS sites_labeled_mesa;
