import express, { Application, Request, Response } from 'express';
import path from 'path';

import geocode from './utils/geocode';
import getWeather from './utils/getWeather';
import assembleMap from './utils/map/assembleMap';
import {
  zoomConversion,
  weatherLayerConversion,
} from './utils/support/inputConversion';

const app: Application = express();
const port = process.env.PORT || 5000;

// Define paths for Express config
const reactPath = path.join(__dirname, '../react-app/build');

// Setup static directory to serve
app.use(express.static(reactPath));

app.get('/api/find-location', async (req: Request, res: Response) => {
  res.set('Access-Control-Allow-Origin', 'http://localhost:3000');

  if (typeof req.query.address !== 'string') {
    return res.send({
      error: 'ERROR: Please type a valid location for the search.',
    });
  } else {
    const geocodeResponse = await geocode(req.query.address);
    return res.send(geocodeResponse);
  }
});

app.get('/api/weather', async (req: Request, res: Response) => {
  res.set('Access-Control-Allow-Origin', 'http://localhost:3000');

  if (!req.query.lat || !req.query.lon) {
    return res.send({
      error: 'ERROR: Please provide valid coordinates.',
    });
  }
  if (typeof req.query.lat === 'string' && typeof req.query.lon === 'string') {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);

    if (!isNaN(lat) && !isNaN(lon)) {
      const weather = await getWeather(lat, lon);
      return res.send(weather);
    } else {
      return res.send({
        error: 'ERROR: Please provide valid coordinates.',
      });
    }
  } else {
    return res.send({
      error: 'ERROR: Please provide valid coordinates.',
    });
  }
});

app.get('/api/weather-map', async (req: Request, res: Response) => {
  res.set('Access-Control-Allow-Origin', 'http://localhost:3000');

  if (
    typeof req.query.lat !== 'string' ||
    typeof req.query.lon !== 'string' ||
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
      error:
        'ERROR: Please provide valid coordinates, zoom level and map layer type.',
    });
  } else {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);

    if (!isNaN(lat) && !isNaN(lon)) {
      const zoom = zoomConversion(req.query.zoom);
      const mapType = weatherLayerConversion(req.query.map__type);

      const response = await assembleMap(lat, lon, zoom, mapType);

      const isErrorTypeNarrowing = (
        response: Buffer | { error: string }
      ): response is { error: string } => {
        return (response as { error: string }).error !== undefined;
      };
      
      if (isErrorTypeNarrowing(response)) {
        res.send(response);
      } else {
        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Content-Length': response.length,
        });
        res.end(response);
      }
    } else {
      return res.send({
        error: 'ERROR: Please provide valid coordinates.',
      });
    }
  }
});

app.get('/*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../react-app/build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is up on port ${port}.`);
});
