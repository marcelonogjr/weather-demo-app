import { useState, useEffect, useContext } from 'react';

import WeatherContext from '../store/weather-context';
import MapContext from '../store/map-context';
import CurrentLocationDate from './WeatherInfo/CurrentLocationDate';
import WeatherUnits from './WeatherInfo/WeatherUnits';
import CurrentWeatherInfo from './WeatherInfo/CurrentWeatherInfo';
import HourlyWeatherInfo from './WeatherInfo/HourlyWeatherInfo';
import DailyWeatherInfo from './WeatherInfo/DailyWeatherInfo';
import LoadingSpinner from './UI/LoadingSpinner';
import WeatherInfoButtons from './WeatherInfo/WeatherInfoButtons';
import WeatherAPIDataType from '../models/WeatherAPIDataType';
import styles from './WeatherInfo.module.css';
 
type currentInfoType = 'current' | 'hourly' | 'daily';

const WeatherInfo = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [weatherData, setWeatherData] = useState<WeatherAPIDataType>();
  const [currentInfo, setCurrentInfo] = useState<currentInfoType>('current');

  const { address, lat, lon, statusIsReady, isReady, units, changeUnits } = useContext(WeatherContext);
  const { zoom, mapLayer } = useContext(MapContext);

  // const serverUrl = 'http://localhost:5000';
  const serverUrl = 'https://weather-nogueira-app.herokuapp.com';

  useEffect(() => {
    const abortController = new AbortController();

    const fetchWeatherInfo = async () => {
      try {
        const response = await fetch(`${serverUrl}/api/weather?lat=${lat}&lon=${lon}`, {signal: abortController.signal});
        const responseJSON = await response.json();
        const typeNarrowing = (response: any): response is WeatherAPIDataType => {
          return (response as WeatherAPIDataType) !== undefined;
        }
        if (typeNarrowing(responseJSON)){
          statusIsReady({
            infoIsReady: true,
          });
          setWeatherData(responseJSON);
        }
      } catch (error: unknown){

      }
    };

    if (lat && lon && zoom && mapLayer && !isReady) {
      setIsLoading(true);
      fetchWeatherInfo();
    }
    
    return () => {
      abortController.abort();
    }
  }, [lat, lon, statusIsReady, zoom, mapLayer, isReady]);

  if (isLoading && isReady) {
    setIsLoading(false);
  }

  const onClickCurrentButtonHandler = () => {
    setCurrentInfo('current');
  };

  const onClickHourlyButtonHandler = () => {
    setCurrentInfo('hourly');
  };

  const onClickDailyButtonHandler = () => {
    setCurrentInfo('daily');
  };

  const unitsChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked === true){
      changeUnits('metric');
    } else {
      changeUnits('imperial');
    }
  };

  return (
    <>
      {isLoading && !isReady && <LoadingSpinner />}
      {!isLoading && weatherData && address && isReady && units && (
        <div className={styles['info-bundle']}>
          <div className={styles['location_units-bundle']}>
            <CurrentLocationDate locationData={address} weatherData={weatherData} />
            <WeatherUnits selectedUnits={units} onChange={unitsChangeHandler}/>
          </div>
          <div className={styles['weather-bundle']}>
            {currentInfo === 'current' && <CurrentWeatherInfo currentData={weatherData.current} />}
            {currentInfo === 'hourly' && <HourlyWeatherInfo hourlyData={weatherData.hourly} />}
            {currentInfo === 'daily' && <DailyWeatherInfo dailyData={weatherData.daily}/>}
            <WeatherInfoButtons
              onCurrentClick={onClickCurrentButtonHandler}
              onHourlyClick={onClickHourlyButtonHandler}
              onDailyClick={onClickDailyButtonHandler}
              currentlyActive={currentInfo}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default WeatherInfo;
