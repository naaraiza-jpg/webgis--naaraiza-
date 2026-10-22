-- Enable spatial features
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create the cities table
CREATE TABLE cities (
    name text PRIMARY KEY,
    county text NOT NULL,
    pop_2020 integer,
    sq_miles numeric(8,2),
    geom geometry(MultiPolygon, 4326) NOT NULL
);

-- Create a spatial index
CREATE INDEX cities_geom_idx
ON cities
USING GIST (geom);