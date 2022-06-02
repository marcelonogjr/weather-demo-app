import express, { Application, Request, Response } from 'express';
import path from 'path';

import geocode from './utils/geocode';
import getWeather from './utils/getWeather';
import assembleMap from './utils/map/assembleMap';
import { zoomConversion, weatherLayerConversion } from './utils/support/inputConversion';

const app: Application = express();
const port = process.env.PORT || 5000;

// Define paths for Express config
const reactPath = path.join(__dirname, '../react-app/build');

// Setup static directory to serve
app.use(express.static(reactPath));

app.get('/api/weather', async (req: Request, res: Response) => {
  res.set('Access-Control-Allow-Origin', 'http://localhost:3000');

  if (!req.query.address) {
    return res.send({
      error: 'ERROR: something went wrong!',
    });
  }

  if (typeof req.query.address === 'string') {
    const geocodeResponse = await geocode(req.query.address);

    if (geocodeResponse) {
      const [lat, lon, placeName] = geocodeResponse;

      const weather = await getWeather(lat, lon);

      if (weather) {
        const finalResponse = {
          weather,
          location: {
            city: placeName[placeName.length-3],
            state: placeName[placeName.length-2],
            country: placeName[placeName.length-1],
          },
        };

        res.send(finalResponse);
      }
    } else {
      return res.send({
        error: 'ERROR: something went wrong!',
      })
    }
  }
});

app.get('/api/weather-map', async (req: Request, res: Response) => {
  res.set('Access-Control-Allow-Origin', 'http://localhost:3000');

  if (
    !req.query.address ||
    (req.query.zoom !== 'small' &&
      req.query.zoom !== 'medium' &&
      req.query.zoom !== 'large') ||
      (req.query.map__type !== 'clouds' &&
      req.query.map__type !== 'precipitation' &&
      req.query.map__type !== 'pressure' &&
      req.query.map__type !== 'wind' &&
      req.query.map__type !== 'temperature')
  ) {
    return res.send({
      error: 'ERROR: something went wrong!',
    });
  }

  if (
    typeof req.query.address === 'string' &&
    (req.query.zoom === 'small' ||
      req.query.zoom === 'medium' ||
      req.query.zoom === 'large') &&
    (req.query.map__type === 'clouds' ||
    req.query.map__type === 'precipitation' ||
    req.query.map__type === 'pressure' ||
    req.query.map__type === 'wind' ||
    req.query.map__type === 'temperature')
  ) {
    const geocodeResponse = await geocode(req.query.address);

    if (geocodeResponse) {
      const [lat, lon] = geocodeResponse;
      const zoom = zoomConversion(req.query.zoom);
      const mapType = weatherLayerConversion(req.query.map__type);

      const response = await assembleMap(lat, lon, zoom, mapType);

      if (response) {
        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Content-Length': response.length,
        });
        res.end(response);
      }
    }
  }
});

app.get('/*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../react-app/build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is up on port ${port}.`);
});
