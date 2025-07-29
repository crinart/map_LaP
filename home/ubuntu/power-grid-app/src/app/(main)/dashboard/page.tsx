// src/app/(main)/dashboard/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { MapComponent } from '@/components/MapComponent';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { MapObject, PowerLine } from '@/types';
import { ObjectsService } from '@/services/objects.service';
import { PowerLinesService } from '@/services/power-lines.service';
import { CommentsService } from '@/services/comments.service';

export default function DashboardPage() {
  const { user } = useAuth();
  const [objects, setObjects] = useState<MapObject[]>([]);
  const [powerLines, setPowerLines] = useState<PowerLine[]>([]);
  const [selectedObject, setSelectedObject] = useState<MapObject | null>(null);
  const [isObjectModalOpen, setIsObjectModalOpen] = useState(false);
  const [isCreateObjectModalOpen, setIsCreateObjectModalOpen] = useState(false);
  const [isCreateLineModalOpen, setIsCreateLineModalOpen] = useState(false);
  const [isCreateByCoordinatesModalOpen, setIsCreateByCoordinatesModalOpen] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);
  const [newObjectCoords, setNewObjectCoords] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);

  // Форма создания объекта
  const [newObjectType, setNewObjectType] = useState<'опора' | 'ТП' | 'РП'>('опора');
  
  // Форма создания объекта по координатам
  const [coordinatesLat, setCoordinatesLat] = useState('');
  const [coordinatesLng, setCoordinatesLng] = useState('');
  
  // Форма создания линии
  const [newLineName, setNewLineName] = useState('');

  // Форма комментария
  const [newComment, setNewComment] = useState('');
  const [commentPhoto, setCommentPhoto] = useState<File | null>(null);

  // Загрузка данных при инициализации
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Проверяем, настроен ли Supabase
      if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project-ref.supabase.co') {
        // Используем демо-данные
        const { DemoDataService } = await import('@/services/demo-data.service');
        setObjects(DemoDataService.getDemoObjects());
        setPowerLines(DemoDataService.getDemoPowerLines());
      } else {
        // Используем реальные данные из Supabase
        const [objectsData, linesData] = await Promise.all([
          ObjectsService.getAllObjects(),
          PowerLinesService.getAllPowerLines()
        ]);
        
        setObjects(objectsData);
        setPowerLines(linesData);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      // В случае ошибки загружаем демо-данные
      const { DemoDataService } = await import('@/services/demo-data.service');
      setObjects(DemoDataService.getDemoObjects());
      setPowerLines(DemoDataService.getDemoPowerLines());
    } finally {
      setLoading(false);
    }
  };

  const handleObjectClick = (object: MapObject) => {
    setSelectedObject(object);
    setIsObjectModalOpen(true);
  };

  const handleMapClick = (coordinates: [number, number]) => {
    if (user?.role === 'руководитель' && !isDrawingMode) {
      setNewObjectCoords(coordinates);
      setIsCreateObjectModalOpen(true);
    }
  };

  const handleDrawingPoint = (coordinates: [number, number]) => {
    if (isDrawingMode) {
      setDrawingPoints(prev => [...prev, coordinates]);
    }
  };

  const startDrawingLine = () => {
    setIsDrawingMode(true);
    setDrawingPoints([]);
  };

  const finishDrawingLine = async () => {
    if (drawingPoints.length < 2) {
      alert('Для создания линии необходимо минимум 2 точки');
      return;
    }

    if (!newLineName.trim()) {
      alert('Введите название линии');
      return;
    }

    try {
      // Проверяем, настроен ли Supabase
      if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project-ref.supabase.co') {
        // Демо-режим: просто добавляем линию локально
        const newLine: PowerLine = {
          id: Date.now().toString(),
          name: newLineName,
          points: drawingPoints.map(([lat, lng]) => ({ lat, lng })),
          created_by: 'demo-user',
          created_at: new Date().toISOString(),
          created_by_name: user?.name || 'Демо пользователь'
        };
        
        setPowerLines(prev => [...prev, newLine]);
      } else {
        // Реальный режим: используем Supabase
        const lineData = {
          name: newLineName,
          points: drawingPoints.map(([lat, lng]) => ({ lat, lng }))
        };

        await PowerLinesService.createPowerLine(lineData);
        await loadData();
      }
      
      // Сбрасываем состояние
      setIsDrawingMode(false);
      setDrawingPoints([]);
      setNewLineName('');
      setIsCreateLineModalOpen(false);
    } catch (error) {
      console.error('Ошибка создания линии:', error);
      alert('Ошибка создания линии');
    }
  };

  const cancelDrawingLine = () => {
    setIsDrawingMode(false);
    setDrawingPoints([]);
    setNewLineName('');
    setIsCreateLineModalOpen(false);
  };

  const createObject = async () => {
    if (!newObjectCoords) return;

    try {
      // Проверяем, настроен ли Supabase
      if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project-ref.supabase.co') {
        // Демо-режим: просто добавляем объект локально
        const newObject: MapObject = {
          id: Date.now().toString(),
          type: newObjectType,
          latitude: newObjectCoords[0],
          longitude: newObjectCoords[1],
          created_by: 'demo-user',
          created_at: new Date().toISOString(),
          created_by_name: user?.name || 'Демо пользователь',
          comments: []
        };
        
        setObjects(prev => [...prev, newObject]);
      } else {
        // Реальный режим: используем Supabase
        const objectData = {
          type: newObjectType,
          latitude: newObjectCoords[0],
          longitude: newObjectCoords[1]
        };

        await ObjectsService.createObject(objectData);
        await loadData();
      }
      
      // Закрываем модальное окно
      setIsCreateObjectModalOpen(false);
      setNewObjectCoords(null);
    } catch (error) {
      console.error('Ошибка создания объекта:', error);
      alert('Ошибка создания объекта');
    }
  };

  const addComment = async () => {
    if (!selectedObject || !newComment.trim()) return;

    try {
      // Проверяем, настроен ли Supabase
      if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project-ref.supabase.co') {
        // Демо-режим: добавляем комментарий локально
        const newCommentObj = {
          id: Date.now().toString(),
          object_id: selectedObject.id,
          user_id: 'demo-user',
          text: newComment,
          photo_url: commentPhoto ? URL.createObjectURL(commentPhoto) : undefined,
          status: 'active' as const,
          created_at: new Date().toISOString(),
          user_name: user?.name || 'Демо пользователь'
        };

        // Обновляем объект с новым комментарием
        setObjects(prev => prev.map(obj => 
          obj.id === selectedObject.id 
            ? { ...obj, comments: [...(obj.comments || []), newCommentObj] }
            : obj
        ));
      } else {
        // Реальный режим: используем Supabase
        let photoUrl = undefined;
        
        if (commentPhoto) {
          photoUrl = await CommentsService.uploadPhoto(commentPhoto, selectedObject.id);
        }

        await CommentsService.createComment({
          object_id: selectedObject.id,
          text: newComment,
          photo_url: photoUrl
        });

        await loadData();
      }
      
      // Сбрасываем форму
      setNewComment('');
      setCommentPhoto(null);
      
      // Закрываем модальное окно
      setIsObjectModalOpen(false);
      setSelectedObject(null);
    } catch (error) {
      console.error('Ошибка добавления комментария:', error);
      alert('Ошибка добавления комментария');
    }
  };

  const markRepairAsDone = async (commentId: string, repairedBy: string) => {
    try {
      // Проверяем, настроен ли Supabase
      if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project-ref.supabase.co') {
        // Демо-режим: обновляем комментарий локально
        setObjects(prev => prev.map(obj => ({
          ...obj,
          comments: obj.comments?.map(comment => 
            comment.id === commentId 
              ? {
                  ...comment,
                  status: 'done' as const,
                  repaired_by: repairedBy,
                  repaired_at: new Date().toISOString()
                }
              : comment
          )
        })));
      } else {
        // Реальный режим: используем Supabase
        await CommentsService.markCommentAsDone(commentId, repairedBy);
        await loadData();
      }
      
      setIsObjectModalOpen(false);
      setSelectedObject(null);
    } catch (error) {
      console.error('Ошибка отметки ремонта:', error);
      alert('Ошибка отметки ремонта как выполненного');
    }
  };

  const deleteObject = async (objectId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот объект?')) {
      return;
    }

    try {
      // Проверяем, настроен ли Supabase
      if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project-ref.supabase.co') {
        // Демо-режим: удаляем объект локально
        setObjects(prev => prev.filter(obj => obj.id !== objectId));
      } else {
        // Реальный режим: используем Supabase
        await ObjectsService.deleteObject(objectId);
        await loadData();
      }
      
      // Закрываем модальное окно если удаляемый объект был выбран
      if (selectedObject?.id === objectId) {
        setIsObjectModalOpen(false);
        setSelectedObject(null);
      }
    } catch (error) {
      console.error('Ошибка удаления объекта:', error);
      alert('Ошибка удаления объекта');
    }
  };

  const createObjectByCoordinates = async () => {
    const lat = parseFloat(coordinatesLat);
    const lng = parseFloat(coordinatesLng);

    if (isNaN(lat) || isNaN(lng)) {
      alert('Введите корректные координаты');
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert('Координаты должны быть в допустимых пределах');
      return;
    }

    try {
      // Проверяем, настроен ли Supabase
      if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project-ref.supabase.co') {
        // Демо-режим: просто добавляем объект локально
        const newObject: MapObject = {
          id: Date.now().toString(),
          type: newObjectType,
          latitude: lat,
          longitude: lng,
          created_by: 'demo-user',
          created_at: new Date().toISOString(),
          created_by_name: user?.name || 'Демо пользователь',
          comments: []
        };
        
        setObjects(prev => [...prev, newObject]);
      } else {
        // Реальный режим: используем Supabase
        const objectData = {
          type: newObjectType,
          latitude: lat,
          longitude: lng
        };

        await ObjectsService.createObject(objectData);
        await loadData();
      }
      
      // Закрываем модальное окно и сбрасываем форму
      setIsCreateByCoordinatesModalOpen(false);
      setCoordinatesLat('');
      setCoordinatesLng('');
      setNewObjectType('опора');
    } catch (error) {
      console.error('Ошибка создания объекта:', error);
      alert('Ошибка создания объекта');
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот комментарий?')) {
      return;
    }

    try {
      // Проверяем, настроен ли Supabase
      if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project-ref.supabase.co') {
        // Демо-режим: удаляем комментарий локально
        setObjects(prev => prev.map(obj => ({
          ...obj,
          comments: obj.comments?.filter(comment => comment.id !== commentId)
        })));
        
        // Обновляем выбранный объект
        if (selectedObject) {
          setSelectedObject(prev => prev ? {
            ...prev,
            comments: prev.comments?.filter(comment => comment.id !== commentId)
          } : null);
        }
      } else {
        // Реальный режим: используем Supabase
        await CommentsService.deleteComment(commentId);
        await loadData();
        
        // Обновляем выбранный объект
        if (selectedObject) {
          const updatedObjects = await ObjectsService.getAllObjects();
          const updatedObject = updatedObjects.find(obj => obj.id === selectedObject.id);
          if (updatedObject) {
            setSelectedObject(updatedObject);
          }
        }
      }
    } catch (error) {
      console.error('Ошибка удаления комментария:', error);
      alert('Ошибка удаления комментария');
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Панель управления */}
      {user?.role === 'руководитель' && (
        <div className="bg-white border-b p-4">
          <div className="flex space-x-4 items-center">
            <Button
              onClick={() => setIsCreateLineModalOpen(true)}
              disabled={isDrawingMode}
            >
              Создать линию ЛЭП
            </Button>
            
            <Button
              onClick={() => setIsCreateByCoordinatesModalOpen(true)}
              variant="secondary"
              disabled={isDrawingMode}
            >
              Создать объект по координатам
            </Button>
            
            <p className="text-sm text-gray-800 flex items-center">
              Кликните по карте для создания объектов
            </p>
          </div>
        </div>
      )}

      {/* Карта */}
      <div className="flex-1">
        <MapComponent
          objects={objects}
          powerLines={powerLines}
          onObjectClick={handleObjectClick}
          onMapClick={handleMapClick}
          isDrawingMode={isDrawingMode}
          onDrawingPoint={handleDrawingPoint}
          onDeleteObject={deleteObject}
          userRole={user?.role}
          drawingPoints={drawingPoints}
          onFinishDrawing={finishDrawingLine}
          onCancelDrawing={cancelDrawingLine}
        />
      </div>

      {/* Модальное окно создания линии */}
      <Modal
        isOpen={isCreateLineModalOpen}
        onClose={cancelDrawingLine}
        title="Создание новой линии ЛЭП"
      >
        <div className="space-y-4">
          <Input
            label="Название линии"
            value={newLineName}
            onChange={(e) => setNewLineName(e.target.value)}
            placeholder="Введите название линии"
          />
          
          <div className="flex space-x-2">
            <Button
              onClick={() => {
                if (newLineName.trim()) {
                  startDrawingLine();
                  setIsCreateLineModalOpen(false);
                } else {
                  alert('Введите название линии');
                }
              }}
            >
              Начать рисование
            </Button>
            <Button variant="secondary" onClick={cancelDrawingLine}>
              Отмена
            </Button>
          </div>
        </div>
      </Modal>

      {/* Панель рисования линии */}
      {isDrawingMode && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-lg shadow-lg border">
          <div className="flex items-center space-x-4">
            <p className="text-sm font-medium">
              Точек добавлено: {drawingPoints.length}
            </p>
            <Button size="sm" onClick={finishDrawingLine}>
              Завершить линию
            </Button>
            <Button size="sm" variant="secondary" onClick={cancelDrawingLine}>
              Отмена
            </Button>
          </div>
        </div>
      )}

      {/* Модальное окно создания объекта */}
      <Modal
        isOpen={isCreateObjectModalOpen}
        onClose={() => setIsCreateObjectModalOpen(false)}
        title="Создание нового объекта"
      >
        <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-900 mb-2 block">
                Тип объекта
              </label>
              <select
                value={newObjectType}
                onChange={(e) => setNewObjectType(e.target.value as 'опора' | 'ТП' | 'РП')}
                className="flex h-10 w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900"
              >
                <option value="опора">Опора</option>
                <option value="ТП">Трансформаторная подстанция (ТП)</option>
                <option value="РП">Распределительный пункт (РП)</option>
              </select>
            </div>
            
            {newObjectCoords && (
              <div className="text-sm text-gray-800">
                <p>Координаты: {newObjectCoords[0].toFixed(6)}, {newObjectCoords[1].toFixed(6)}</p>
              </div>
            )}
          
          <div className="flex space-x-2">
            <Button onClick={createObject}>
              Создать объект
            </Button>
            <Button variant="secondary" onClick={() => setIsCreateObjectModalOpen(false)}>
              Отмена
            </Button>
          </div>
        </div>
      </Modal>

      {/* Модальное окно деталей объекта */}
      <Modal
        isOpen={isObjectModalOpen}
        onClose={() => {
          setIsObjectModalOpen(false);
          setSelectedObject(null);
          setNewComment('');
          setCommentPhoto(null);
        }}
        title={selectedObject ? `${selectedObject.type} - Детали` : ''}
        size="lg"
      >
        {selectedObject && (
          <div className="space-y-6">
            {/* Информация об объекте */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">Информация об объекте</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-900">Тип:</span> <span className="text-gray-800">{selectedObject.type}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Координаты:</span> <span className="text-gray-800">{selectedObject.latitude.toFixed(6)}, {selectedObject.longitude.toFixed(6)}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Создан:</span> <span className="text-gray-800">{new Date(selectedObject.created_at).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-900">Создатель:</span> <span className="text-gray-800">{selectedObject.created_by_name || 'Неизвестно'}</span>
                </div>
              </div>
            </div>

            {/* Комментарии */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Комментарии</h4>
              
              {selectedObject.comments && selectedObject.comments.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {selectedObject.comments.map((comment) => (
                    <div 
                      key={comment.id} 
                      className={`p-4 rounded-lg border ${
                        comment.status === 'done' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-medium text-gray-900">{comment.user_name}</span>
                          <span className="text-sm text-gray-700 ml-2">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          comment.status === 'done' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {comment.status === 'done' ? 'Выполнено' : 'Активно'}
                        </span>
                      </div>
                      
                      <p className="text-gray-900 mb-3">{comment.text}</p>
                      
                      {comment.photo_url && (
                        <img 
                          src={comment.photo_url} 
                          alt="Фото к комментарию"
                          className="max-w-xs rounded-lg mb-3"
                        />
                      )}

                      {comment.status === 'done' && comment.repaired_by && (
                        <div className="text-sm text-green-700">
                          <span className="font-medium">Выполнил:</span> {comment.repaired_by}
                          <br />
                          <span className="font-medium">Дата выполнения:</span> {new Date(comment.repaired_at!).toLocaleDateString()}
                        </div>
                      )}

                      {comment.status === 'active' && user?.role === 'руководитель' && (
                        <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              const executor = prompt('Введите ФИО исполнителя:');
                              if (executor) {
                                markRepairAsDone(comment.id, executor);
                              }
                            }}
                          >
                            Отметить как выполненное
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => deleteComment(comment.id)}
                            className="bg-red-50 text-red-700 hover:bg-red-100"
                          >
                            Удалить комментарий
                          </Button>
                        </div>
                      )}

                      {comment.status === 'done' && user?.role === 'руководитель' && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => deleteComment(comment.id)}
                            className="bg-red-50 text-red-700 hover:bg-red-100"
                          >
                            Удалить комментарий
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-800 mb-6">Комментариев пока нет</p>
              )}

              {/* Форма добавления комментария */}
              <div className="border-t border-gray-300 pt-4">
                <h5 className="font-medium text-gray-900 mb-3">Добавить комментарий</h5>
                <div className="space-y-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Опишите проблему или состояние объекта..."
                    className="w-full p-3 border border-gray-400 rounded-md resize-none text-gray-900 placeholder:text-gray-600"
                    rows={3}
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Прикрепить фото (опционально)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCommentPhoto(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  
                  <Button onClick={addComment} disabled={!newComment.trim()}>
                    Добавить комментарий
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Модальное окно создания объекта по координатам */}
      <Modal
        isOpen={isCreateByCoordinatesModalOpen}
        onClose={() => {
          setIsCreateByCoordinatesModalOpen(false);
          setCoordinatesLat('');
          setCoordinatesLng('');
          setNewObjectType('опора');
        }}
        title="Создание объекта по координатам"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-900 mb-2 block">
              Тип объекта
            </label>
            <select
              value={newObjectType}
              onChange={(e) => setNewObjectType(e.target.value as 'опора' | 'ТП' | 'РП')}
              className="flex h-10 w-full rounded-md border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900"
            >
              <option value="опора">Опора</option>
              <option value="ТП">Трансформаторная подстанция (ТП)</option>
              <option value="РП">Распределительный пункт (РП)</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Широта"
              value={coordinatesLat}
              onChange={(e) => setCoordinatesLat(e.target.value)}
              placeholder="Например: 66.0834"
              type="number"
              step="any"
            />
            
            <Input
              label="Долгота"
              value={coordinatesLng}
              onChange={(e) => setCoordinatesLng(e.target.value)}
              placeholder="Например: 76.6800"
              type="number"
              step="any"
            />
          </div>
          
          <div className="text-xs text-gray-800">
            <p className="font-medium mb-1">Примеры координат:</p>
            <p>• Новый Уренгой: 66.0834, 76.6800</p>
            <p>• Москва: 55.7558, 37.6176</p>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={createObjectByCoordinates}
              disabled={!coordinatesLat || !coordinatesLng}
            >
              Создать объект
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => {
                setIsCreateByCoordinatesModalOpen(false);
                setCoordinatesLat('');
                setCoordinatesLng('');
                setNewObjectType('опора');
              }}
            >
              Отмена
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

