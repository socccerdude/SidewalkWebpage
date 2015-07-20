L.mapbox.accessToken = 'pk.eyJ1Ijoia290YXJvaGFyYSIsImEiOiJDdmJnOW1FIn0.kJV65G6eNXs4ATjWCtkEmA';
// var tileUrl = "https://a.tiles.mapbox.com/v4/kotarohara.mmoldjeh/page.html?access_token=pk.eyJ1Ijoia290YXJvaGFyYSIsImEiOiJDdmJnOW1FIn0.kJV65G6eNXs4ATjWCtkEmA#13/38.8998/-77.0638";
var tileUrl = "https:\/\/a.tiles.mapbox.com\/v4\/kotarohara.8e0c6890\/{z}\/{x}\/{y}.png?access_token=pk.eyJ1Ijoia290YXJvaGFyYSIsImEiOiJDdmJnOW1FIn0.kJV65G6eNXs4ATjWCtkEmA";
var mapboxTiles = L.tileLayer(tileUrl, {
    attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>'
});

var map = L.mapbox.map('map', "kotarohara.8e0c6890", {zoomControl: false})
        // .addLayer(mapboxTiles)
        .setView([38.910, -77.040], 17);

// Don't allow zooming (yet!)
map.touchZoom.disable();
map.doubleClickZoom.disable();
map.scrollWheelZoom.disable();

var overlayPolygon = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [[-75, 36], [-75, 40], [-78, 40], [-78, 36],[-75, 36]]
                ]
            }
        }
    ]
};

var overlayPolygonLayer = L.geoJson(overlayPolygon).addTo(map);

// Prepare a layer to put d3 stuff
var svg = d3.select(map.getPanes().overlayPane).append("svg");  // The base svg
var g = svg.append("g").attr("class", "leaflet-zoom-hide");  // The root group

// Import the sample data and start animating
var filename = "/assets/resources/p-and-17th-nw-points.geojson";
d3.json(filename, function (collection) {
    animate(collection);
});

/**
 * This function animates how a user (represented as a yellow circle) walked through the map and labeled
 * accessibility attributes.
 *
 * param walkTrajectory A trajectory of a user's auditing activity in a GeoJSON FeatureCollection format.
 */
function animate(walkTrajectory) {
    // https://github.com/mbostock/d3/wiki/Geo-Streams#stream-transforms
    var transform = d3.geo.transform({point: projectPoint});
    var d3path = d3.geo.path().projection(transform);
    var featuresdata = walkTrajectory.features;
    var markerGroup = g.append("g").data(featuresdata);
    var marker = markerGroup.append("circle")
            .attr("r", 2)
            .attr("id", "marker")
            .attr("class", "travelMarker");
    var markerNose = markerGroup.append("line")
            .attr({'x1': 0, 'y1': -3, 'x2': 0, 'y2': -10})
            .attr('stroke', 'gray')
            .attr('stroke-width', 2);

    // Set the initial heading
    markerGroup.attr("transform", function () {
        var y = featuresdata[0].geometry.coordinates[1];
        var x = featuresdata[0].geometry.coordinates[0];
        var heading = featuresdata[0].properties.heading;
        return "translate(" +
                map.latLngToLayerPoint(new L.LatLng(y, x)).x + "," +
                map.latLngToLayerPoint(new L.LatLng(y, x)).y + ")" +
                "rotate(" + heading + ")";
    });


    // Get the bounding box and align the svg
    var bounds = d3path.bounds(walkTrajectory),
            topLeft = bounds[0],
            bottomRight = bounds[1];
    svg.attr("width", bottomRight[0] - topLeft[0] + 120)
            .attr("height", bottomRight[1] - topLeft[1] + 120)
            .style("left", topLeft[0] - 50 + "px")
            .style("top", topLeft[1] - 50 + "px");
    g.attr("transform", "translate(" + (-topLeft[0] + 50) + "," + (-topLeft[1] + 50) + ")");

    // Apply the toLine function to align the path to
    markerGroup.attr("transform", function () {
        var y = featuresdata[0].geometry.coordinates[1];
        var x = featuresdata[0].geometry.coordinates[0];
        return "translate(" +
                map.latLngToLayerPoint(new L.LatLng(y, x)).x + "," +
                map.latLngToLayerPoint(new L.LatLng(y, x)).y + ")";
    });

    // Animate the marker
    markerGroup = markerGroup.attr("counter", 0)
            .transition()
            .each("start", function () {
                var thisMarker = d3.select(d3.select(this).node().children[0]);
                var thisMarkerNose = d3.select(d3.select(this).node().children[0]);

                thisMarker.transition()
                        .duration(250)
                        .attr("r", 7);
            })
            .duration(750);

    // Chain transitions
    for (var i = 0; i < featuresdata.length; i++) {
        markerGroup = markerGroup.transition()
                .duration(750)
                .attr("transform", function () {
                    var y = featuresdata[i].geometry.coordinates[1];
                    var x = featuresdata[i].geometry.coordinates[0];
                    var heading = featuresdata[i].properties.heading;
                    return "translate(" +
                            map.latLngToLayerPoint(new L.LatLng(y, x)).x + "," +
                            map.latLngToLayerPoint(new L.LatLng(y, x)).y + ")" +
                            "rotate(" + heading + ")";
                })
                .each("end", function () {
                    // At the end of each walk, increment the counter to keep track of the state changes.
                    // If the "label" is in the data, draw the label data and attach mouseover/mouseout events.
                    var counter = d3.select(this).attr("counter");
                    var d = featuresdata[counter];
                    if (d) {
                        if ("label" in d.properties) {
                            var label = d.properties.label;
                            var p = map.latLngToLayerPoint(new L.LatLng(label.coordinates[1], label.coordinates[0]));
                            var c = g.append("circle")
                                    .attr("r", 3)
                                    .attr("cx", p.x)
                                    .attr("cy", p.y)
                                    .attr("fill", "#fff")
                                    .attr("color", "#ccc")
                                    .attr("stroke", "#888")
                                    .attr("stroke-width", 1)
                                    .on("mouseover", function () {
                                        d3.select(this).attr("r", 15);
                                    })
                                    .on("mouseout", function () {
                                       d3.select(this).attr("r", 3);
                                    });

                        }
                    }
                    d3.select(this).attr("counter", ++counter);
                });
    }
    // Finally delete the marker
    markerGroup = markerGroup.transition()
            .each("start", function () {
                var thisMarker = d3.select(d3.select(this).node().children[0]);
                thisMarker.transition()
                        .delay(500)
                        .duration(250)
                        .attr("r", 1);
            })
            .duration(750)
            .remove();
}

function projectPoint(x, y) {
    var point = map.latLngToLayerPoint(new L.LatLng(y, x));

    // https://github.com/mbostock/d3/wiki/Geo-Streams#stream-transforms
    this.stream.point(point.x, point.y);
}
function applyLatLngToLayer(d) {
    var y = d.geometry.coordinates[1];
    var x = d.geometry.coordinates[0];
    return map.latLngToLayerPoint(new L.LatLng(y, x))
}
