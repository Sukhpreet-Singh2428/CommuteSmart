import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface RouteData {
  startPoint: string;
  endPoint: string;
  startCoords: [number, number] | null;
  endCoords: [number, number] | null;
  routePath: [number, number][] | null;
}

interface RouteContextType {
  routeData: RouteData;
  setStartPoint: (point: string, coords?: [number, number]) => void;
  setEndPoint: (point: string, coords?: [number, number]) => void;
  setRoutePath: (path: [number, number][]) => void;
  clearRoute: () => void;
}

const defaultRouteData: RouteData = {
  startPoint: '',
  endPoint: '',
  startCoords: null,
  endCoords: null,
  routePath: null,
};

const RouteContext = createContext<RouteContextType | undefined>(undefined);

export function RouteProvider({ children }: { children: ReactNode }) {
  const [routeData, setRouteData] = useState<RouteData>(defaultRouteData);

  const setStartPoint = (point: string, coords?: [number, number]) => {
    setRouteData(prev => ({ ...prev, startPoint: point, startCoords: coords || null }));
  };

  const setEndPoint = (point: string, coords?: [number, number]) => {
    setRouteData(prev => ({ ...prev, endPoint: point, endCoords: coords || null }));
  };

  const setRoutePath = (path: [number, number][]) => {
    setRouteData(prev => ({ ...prev, routePath: path }));
  };

  const clearRoute = () => {
    setRouteData(defaultRouteData);
  };

  return (
    <RouteContext.Provider
      value={{
        routeData,
        setStartPoint,
        setEndPoint,
        setRoutePath,
        clearRoute,
      }}
    >
      {children}
    </RouteContext.Provider>
  );
}

export function useRoute() {
  const context = useContext(RouteContext);
  if (context === undefined) {
    throw new Error('useRoute must be used within a RouteProvider');
  }
  return context;
}
