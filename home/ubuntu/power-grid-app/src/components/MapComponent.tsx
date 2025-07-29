// src/components/MapComponent.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapObject, PowerLine } from '@/types';
import { Trash2 } from 'lucide-react';

interface MapComponentProps {
  onObjectClick?: (object: MapObject) => void;
  onMapClick?: (coordinates: [number, number]) => void;
  objects: MapObject[];
  powerLines: PowerLine[];
  isDrawingMode?: boolean;
  onDrawingPoint?: (coordinates: [number, number]) => void;
  onDeleteObject?: (objectId: string) => void;
  userRole?: string;
  drawingPoints?: [number, number][];
  onFinishDrawing?: () => void;
  onCancelDrawing?: () => void;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  onObjectClick,
  onMapClick,
  objects,
  powerLines,
  isDrawingMode = false,
  onDrawingPoint,
  onDeleteObject,
  userRole,
  drawingPoints = [],
  onFinishDrawing,
  onCancelDrawing
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [ymaps, setYmaps] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tempPolyline, setTempPolyline] = useState<any>(null);

  // Загрузка API Яндекс.Карт
  useEffect(() => {
    const loadScript = () => {
      return new Promise((resolve, reject) => {
        if (typeof window !== 'undefined') {
          const script = document.createElement('script');
          script.src = '/yandex-map-loader.js';
          script.onload = () => {
            if (window.loadYandexMaps) {
              window.loadYandexMaps(process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY!)
                .then(resolve)
                .catch(reject);
            } else {
              reject(new Error('loadYandexMaps function not found'));
            }
          };
          script.onerror = reject;
          document.head.appendChild(script);
        }
      });
    };

    loadScript()
      .then((loadedYmaps) => {
        setYmaps(loadedYmaps);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Ошибка загрузки Яндекс.Карт:', error);
        setIsLoading(false);
      });
  }, []);

  // Инициализация карты
  useEffect(() => {
    if (ymaps && mapRef.current && !map) {
      // Инициализация карты с центром в Новом Уренгое
      const newMap = new ymaps.Map(mapRef.current, {
        center: [66.0834, 76.6800], // Новый Уренгой
        zoom: 10,
        controls: ['zoomControl', 'fullscreenControl', 'typeSelector']
      });

      // Добавляем обработчик клика по карте
      newMap.events.add('click', (e: any) => {
        const coords = e.get('coords');
        
        if (isDrawingMode && onDrawingPoint) {
          onDrawingPoint(coords);
        } else if (onMapClick) {
          onMapClick(coords);
        }
      });

      setMap(newMap);
    }
  }, [ymaps, isDrawingMode, onDrawingPoint, onMapClick]);

  // Отображение временной линии при рисовании
  useEffect(() => {
    if (map && ymaps && isDrawingMode && drawingPoints.length > 1) {
      // Удаляем предыдущую временную линию
      if (tempPolyline) {
        map.geoObjects.remove(tempPolyline);
      }

      // Создаем новую временную линию
      const newTempPolyline = new ymaps.Polyline(
        drawingPoints,
        {
          balloonContent: 'Создаваемая линия ЛЭП'
        },
        {
          strokeColor: '#ff6b6b',
          strokeWidth: 3,
          strokeOpacity: 0.8,
          strokeStyle: 'dash'
        }
      );

      map.geoObjects.add(newTempPolyline);
      setTempPolyline(newTempPolyline);
    } else if (!isDrawingMode && tempPolyline) {
      // Убираем временную линию когда выходим из режима рисования
      map.geoObjects.remove(tempPolyline);
      setTempPolyline(null);
    }
  }, [map, ymaps, isDrawingMode, drawingPoints, tempPolyline]);

  // Отображение объектов на карте
  useEffect(() => {
    if (map && ymaps && objects.length >= 0) {
      // Очищаем предыдущие объекты
      map.geoObjects.removeAll();

      objects.forEach((object) => {
        const placemark = new ymaps.Placemark(
          [object.latitude, object.longitude],
          {
            balloonContent: createBalloonContent(object),
            hintContent: `${object.type} (ID: ${object.id})`
          },
          {
            preset: getObjectIcon(object.type),
            iconColor: getObjectColor(object)
          }
        );

        placemark.events.add('click', () => {
          if (isDrawingMode && onDrawingPoint) {
            // В режиме рисования добавляем координаты объекта как точку для линии
            onDrawingPoint([object.latitude, object.longitude]);
          } else {
            // В обычном режиме открываем информацию об объекте
            onObjectClick?.(object);
          }
        });

        map.geoObjects.add(placemark);
      });

      // Отображение линий электропередач
      powerLines.forEach((line) => {
        const polyline = new ymaps.Polyline(
          line.points.map((point: any) => [point.lat, point.lng]),
          {
            balloonContent: `
              <div style="padding: 10px;">
                <h4 style="margin: 0 0 10px 0;">${line.name}</h4>
                <p style="margin: 0; font-size: 12px; color: #666;">
                  Создана: ${new Date(line.created_at).toLocaleDateString()}
                </p>
              </div>
            `
          },
          {
            strokeColor: '#0066cc',
            strokeWidth: 3,
            strokeOpacity: 0.8
          }
        );

        map.geoObjects.add(polyline);
      });
    }
  }, [map, ymaps, objects, powerLines, onObjectClick]);

  const getObjectIcon = (type: string) => {
    switch (type) {
      case 'опора':
        return 'islands#blueCircleDotIcon';
      case 'ТП':
        return 'islands#blueSquareIcon';
      case 'РП':
        return 'islands#blueTriangleIcon';
      default:
        return 'islands#blueIcon';
    }
  };

  const getObjectColor = (object: MapObject) => {
    // Проверяем, есть ли активные комментарии
    const hasActiveComments = object.comments?.some((comment) => comment.status === 'active');
    if (hasActiveComments) {
      return '#dc2626'; // красный для проблем
    }
    
    const hasCompletedRepairs = object.comments?.some((comment) => comment.status === 'done');
    if (hasCompletedRepairs) {
      return '#16a34a'; // зеленый для завершенных ремонтов
    }
    
    return '#3b82f6'; // синий для обычных объектов
  };

  const createBalloonContent = (object: MapObject) => {
    const commentsCount = object.comments?.length || 0;
    const activeCommentsCount = object.comments?.filter(c => c.status === 'active').length || 0;
    
    const deleteButton = userRole === 'руководитель' && onDeleteObject ? 
      `<button onclick="window.deleteObject('${object.id}')" 
         style="background: #dc2626; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; margin-top: 8px;">
         🗑️ Удалить объект
       </button>` : '';
    
    return `
      <div style="padding: 10px; max-width: 300px;">
        <h4 style="margin: 0 0 10px 0; color: #1f2937; font-weight: bold;">${object.type}</h4>
        <p style="margin: 5px 0; font-size: 12px; color: #374151;">
          <strong>Координаты:</strong> ${object.latitude.toFixed(6)}, ${object.longitude.toFixed(6)}
        </p>
        <p style="margin: 5px 0; font-size: 12px; color: #374151;">
          <strong>Создан:</strong> ${new Date(object.created_at).toLocaleDateString()}
        </p>
        <p style="margin: 5px 0; font-size: 12px; color: #374151;">
          <strong>Комментариев:</strong> ${commentsCount} (активных: ${activeCommentsCount})
        </p>
        ${deleteButton}
      </div>
    `;
  };

  // Устанавливаем глобальную функцию удаления для использования в балуне
  useEffect(() => {
    if (typeof window !== 'undefined' && onDeleteObject) {
      (window as any).deleteObject = (objectId: string) => {
        onDeleteObject(objectId);
      };
    }
  }, [onDeleteObject]);

  if (isLoading) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка карты...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapRef} 
        className="w-full h-full min-h-[400px]"
        style={{ width: '100%', height: '100%' }}
      />
      {isDrawingMode && (
        <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg border">
          <p className="text-sm font-medium text-gray-800 mb-2">
            Режим рисования линии ЛЭП
          </p>
          <p className="text-xs text-gray-600 mb-3">
            Кликайте по карте для добавления точек ({drawingPoints.length} точек)
          </p>
          <div className="flex gap-2">
            {drawingPoints.length >= 2 && onFinishDrawing && (
              <button
                onClick={onFinishDrawing}
                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
              >
                Завершить линию
              </button>
            )}
            {onCancelDrawing && (
              <button
                onClick={onCancelDrawing}
                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
              >
                Отмена
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

