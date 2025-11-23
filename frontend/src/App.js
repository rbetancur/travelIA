import React, { useState, useEffect, useRef, useMemo, useCallback, useTransition, startTransition } from 'react';
import axios from 'axios';
import { 
  Luggage, 
  Plane, 
  MapPin, 
  Calendar, 
  Unlock, 
  Users, 
  User, 
  Baby, 
  Mountain, 
  Umbrella, 
  Landmark, 
  X, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  ChevronRight, 
  ChevronLeft, 
  Minus, 
  Plus,
  Hotel,
  UtensilsCrossed,
  Lightbulb,
  DollarSign,
  Cloud,
  Thermometer,
  Droplets,
  Wind,
  Image,
  Clock,
  Globe,
  Radio,
  History,
  MessageSquare,
  Download,
  FileText,
  Bookmark,
  Trash2,
  Heart
} from 'lucide-react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [showForm, setShowForm] = useState(true);
  const [formData, setFormData] = useState({
    destination: '',
    departureDate: '',
    returnDate: '',
    adults: 1,
    children: 0,
    infants: 0,
    budget: '',
    preference: ''
  });
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [popularDestinations, setPopularDestinations] = useState([]);
  const [loadingDestinations, setLoadingDestinations] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [destinationError, setDestinationError] = useState('');
  const searchTimeoutRef = useRef(null);
  const [tripType, setTripType] = useState('closed'); // 'closed' o 'open'
  const [showDateModal, setShowDateModal] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [isSelectingStart, setIsSelectingStart] = useState(true);
  const [hoverDate, setHoverDate] = useState(null);
  const [modalTripType, setModalTripType] = useState('round-trip'); // 'round-trip' o 'one-way'
  const [showTravelersModal, setShowTravelersModal] = useState(false);
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [weather, setWeather] = useState(null);
  const [photos, setPhotos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [realtimeInfo, setRealtimeInfo] = useState(null);
  const [loadingRealtimeInfo, setLoadingRealtimeInfo] = useState(false);
  const [showRealtimePanel, setShowRealtimePanel] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0); // Mantener para compatibilidad con código legacy
  const [carouselIndices, setCarouselIndices] = useState({}); // Índices por mensaje: { 'result-0': 0, 'result-1': 2, ... }
  const [carouselDirection, setCarouselDirection] = useState('right');
  const contentScrollRef = useRef(null);
  const sectionScrollRefs = useRef({}); // Refs para cada sección de cada mensaje
  const lastFormDataRef = useRef(null);
  const lastTripTypeRef = useRef(null);
  const [isPending, startTransition] = useTransition();
  const [sessionId, setSessionId] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [favoriteToDelete, setFavoriteToDelete] = useState(null);
  const [deleteAllFavorites, setDeleteAllFavorites] = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [expandedResults, setExpandedResults] = useState({});
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [chatMessages, setChatMessages] = useState([]); // Almacenar mensajes enviados
  
  // Función para limpiar texto técnico innecesario (debe estar antes de parseResponseSections)
  const cleanText = useCallback((text) => {
    if (!text) return '';
    
    // Eliminar bloques de código markdown (```json, ```, etc.)
    let cleaned = text
      .replace(/```[\s\S]*?```/g, '') // Eliminar bloques de código completos
      .replace(/```json\s*/gi, '') // Eliminar inicio de bloque json
      .replace(/```\s*/g, '') // Eliminar cierres de bloque
      .replace(/^\s*json\s*$/gmi, '') // Eliminar líneas que solo dicen "json"
      .trim();
    
    // Eliminar líneas que solo contienen caracteres técnicos o están vacías
    const lines = cleaned.split('\n')
      .map(line => line.trim())
      .filter(line => {
        // Filtrar líneas vacías o que solo contienen caracteres técnicos
        if (!line) return false;
        // Eliminar líneas que son solo símbolos técnicos
        if (/^[`{}[\],:;]+$/.test(line)) return false;
        // Eliminar líneas que empiezan con caracteres técnicos comunes
        if (/^[`{}\]\[,;:]/.test(line) && line.length < 10) return false;
        return true;
      });
    
    cleaned = lines.join('\n').trim();
    
    // Si después de limpiar no queda nada útil, retornar vacío
    if (!cleaned || cleaned.length < 3) return '';
    
    return cleaned;
  }, []);

  // Función de respaldo para parsear formato TOON legacy
  const parseResponseSectionsLegacy = useCallback((responseText) => {
    const sections = {};
    const sectionNames = [
      'ALOJAMIENTO',
      'COMIDA LOCAL',
      'LUGARES IMPERDIBLES',
      'CONSEJOS LOCALES',
      'ESTIMACIÓN DE COSTOS'
    ];

    const lines = responseText.split('\n');
    let currentSection = null;
    let currentContent = [];
    let beforeText = [];
    let afterText = [];
    let firstSectionIndex = -1;
    let inSections = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        if (currentSection) {
          currentContent.push('');
        } else if (!inSections) {
          beforeText.push(line);
        } else {
          afterText.push(line);
        }
        continue;
      }

      let foundSection = false;
      
      for (const sectionName of sectionNames) {
        const upperLine = trimmedLine.toUpperCase();
        const normalizedSectionName = sectionName.replace(/\s+/g, ' ');
        const normalizedLine = upperLine.replace(/\s+/g, ' ');
        
        if (normalizedLine.startsWith(normalizedSectionName)) {
          const afterName = normalizedLine.substring(normalizedSectionName.length).trim();
          const hasSeparator = afterName === '' || 
                              afterName.startsWith('|') || 
                              afterName.startsWith(':') ||
                              /^\([^)]+\)\s*[|:]/.test(afterName);
          
          if (hasSeparator) {
            if (currentSection) {
              sections[currentSection] = currentContent.join('\n').trim();
            }
            
            if (firstSectionIndex === -1) {
              firstSectionIndex = i;
              inSections = true;
            }
            
            currentSection = sectionName;
            currentContent = [];
            foundSection = true;
            
            const sectionPattern = new RegExp(sectionName.replace(/\s+/g, '\\s*'), 'i');
            const match = trimmedLine.match(sectionPattern);
            
            if (match) {
              const afterMatch = trimmedLine.substring(match.index + match[0].length).trim();
              if (afterMatch) {
                let content = afterMatch.replace(/^\([^)]+\)\s*/, '');
                content = content.replace(/^[|:\-]\s*/, '').trim();
                if (content) {
                  currentContent.push(content);
                }
              }
            }
            break;
          }
        }
      }

      if (!foundSection) {
        if (currentSection) {
          currentContent.push(line);
        } else if (!inSections) {
          beforeText.push(line);
        } else {
          afterText.push(line);
        }
      }
    }

    if (currentSection) {
      sections[currentSection] = currentContent.join('\n').trim();
    }

    if (Object.keys(sections).length > 0) {
      return {
        sections: sections,
        beforeText: beforeText.join('\n').trim(),
        afterText: afterText.join('\n').trim()
      };
    }

    return null;
  }, []);

  // Función para parsear las secciones de la respuesta (memoizada)
  const parseResponseSections = useCallback((responseText) => {
    if (!responseText) return null;

    // Mapeo de nombres de secciones en JSON a nombres para mostrar
    const sectionMapping = {
      'alojamiento': 'ALOJAMIENTO',
      'comida_local': 'COMIDA LOCAL',
      'lugares_imperdibles': 'LUGARES IMPERDIBLES',
      'consejos_locales': 'CONSEJOS LOCALES',
      'estimacion_costos': 'ESTIMACIÓN DE COSTOS'
    };

    // Intentar extraer JSON de la respuesta
    let jsonData = null;
    let beforeText = '';
    let afterText = '';

    // Buscar JSON en la respuesta (puede venir con texto antes/después)
    try {
      // Intentar encontrar un bloque JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        jsonData = JSON.parse(jsonStr);
        
        // Extraer texto antes y después del JSON
        const jsonIndex = responseText.indexOf(jsonStr);
        if (jsonIndex > 0) {
          beforeText = cleanText(responseText.substring(0, jsonIndex));
        }
        const afterIndex = jsonIndex + jsonStr.length;
        if (afterIndex < responseText.length) {
          afterText = cleanText(responseText.substring(afterIndex));
        }
      } else {
        // Si no hay JSON explícito, intentar parsear toda la respuesta como JSON
        jsonData = JSON.parse(responseText);
      }
    } catch (error) {
      // Si no es JSON válido, intentar parseo legacy (formato TOON)
      console.warn('No se pudo parsear como JSON, intentando formato legacy:', error);
      return parseResponseSectionsLegacy(responseText);
    }

    // Validar que jsonData sea un objeto con las secciones esperadas
    if (!jsonData || typeof jsonData !== 'object') {
      console.warn('JSON parseado no es un objeto válido');
      return parseResponseSectionsLegacy(responseText);
    }

    // Convertir las secciones del JSON al formato esperado
    const sections = {};
    let hasSections = false;

    for (const [jsonKey, displayName] of Object.entries(sectionMapping)) {
      if (jsonData[jsonKey] && Array.isArray(jsonData[jsonKey])) {
        // Convertir array a string con saltos de línea
        sections[displayName] = jsonData[jsonKey]
          .filter(item => item && typeof item === 'string' && item.trim())
          .join('\n');
        hasSections = true;
      }
    }

    // Si no encontramos secciones válidas, intentar formato legacy
    if (!hasSections) {
      console.warn('No se encontraron secciones válidas en el JSON');
      return parseResponseSectionsLegacy(responseText);
    }

    return {
      sections: sections,
      beforeText: beforeText,
      afterText: afterText
    };
  }, [cleanText, parseResponseSectionsLegacy]);

  // Función para parsear el mensaje del clima y extraer información (memoizada)
  const parseWeatherInfo = useCallback((weatherText) => {
    if (!weatherText) return null;
    
    // Extraer ciudad del formato: "🌤️ **Clima Actual en Ciudad, País:**"
    // También manejar formato sin emoji: "**Clima Actual en Ciudad, País:**"
    const cityMatch = weatherText.match(/(?:🌤️\s*)?\*\*Clima Actual en ([^:]+):\*\*/);
    const city = cityMatch ? cityMatch[1].trim() : '';
    
    if (!city) return null; // Si no hay ciudad, no hay información válida
    
    // Extraer datos del clima (temperatura, condiciones, humedad, viento)
    const lines = weatherText.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed && (trimmed.includes('•') || trimmed.includes('T:') || trimmed.includes('Temperatura') || trimmed.includes('Condiciones') || trimmed.includes('Humedad') || trimmed.includes('Viento'));
    });
    
    const weatherData = {
      temperatura: '',
      condiciones: '',
      humedad: '',
      viento: ''
    };
    
    lines.forEach(line => {
      const cleanLine = line.replace(/\*\*/g, '').replace(/🌤️/g, '').trim();
      // Nuevo formato técnico: "T: -1.8°C / ST: -3.9°C"
      if (cleanLine.includes('T:') && cleanLine.includes('ST:')) {
        weatherData.temperatura = cleanLine.replace(/•\s*/, '').trim();
      } else if (cleanLine.includes('Temperatura:')) {
        // Formato legacy por si acaso
        weatherData.temperatura = cleanLine.replace(/•\s*Temperatura:\s*/, '').replace(/Temperatura:\s*/, '').trim();
      } else if (cleanLine.includes('Condiciones:')) {
        weatherData.condiciones = cleanLine.replace(/•\s*Condiciones:\s*/, '').replace(/Condiciones:\s*/, '').trim();
      } else if (cleanLine.includes('Humedad:')) {
        weatherData.humedad = cleanLine.replace(/•\s*Humedad:\s*/, '').replace(/Humedad:\s*/, '').trim();
      } else if (cleanLine.includes('Viento:')) {
        weatherData.viento = cleanLine.replace(/•\s*Viento:\s*/, '').replace(/Viento:\s*/, '').trim();
      }
    });
    
    return { city, ...weatherData };
  }, []);

  // Memoizar sugerencias filtradas de destinos populares
  const filteredPopularDestinations = useMemo(() => {
    if (!formData.destination || formData.destination.trim().length === 0) {
      return popularDestinations.slice(0, 5);
    }
    return popularDestinations.filter(dest =>
      dest.toLowerCase().includes(formData.destination.toLowerCase())
    ).slice(0, 5);
  }, [formData.destination, popularDestinations]);

  // Memoizar el parseo de la respuesta para evitar re-parsear en cada render
  // IMPORTANTE: Estos hooks deben estar antes de cualquier return condicional
  const parsedResponse = useMemo(() => {
    if (!response) return null;
    return parseResponseSections(response);
  }, [response, parseResponseSections]);

  // Memoizar información del clima parseada
  const weatherInfo = useMemo(() => {
    if (!weather) return null;
    return parseWeatherInfo(weather);
  }, [weather]);

  // Preload de destinos populares al montar el componente
  useEffect(() => {
    // Cargar destinos populares inmediatamente al montar
    // Esto asegura que estén disponibles antes de que el usuario interactúe
    loadPopularDestinations().catch(error => {
      console.error('Error al precargar destinos populares:', error);
    });
  }, []);

  // Limpiar timeout al desmontar el componente
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Función para actualizar indicadores de scroll (memoizada)
  const updateScrollIndicators = useCallback((element) => {
    if (!element) return;
    
    const { scrollTop, scrollHeight, clientHeight } = element;
    const isScrollable = scrollHeight > clientHeight;
    
    if (isScrollable) {
      if (scrollTop > 10) {
        element.classList.add('scrollable-top');
      } else {
        element.classList.remove('scrollable-top');
      }
      
      if (scrollTop < scrollHeight - clientHeight - 10) {
        element.classList.add('scrollable-bottom');
      } else {
        element.classList.remove('scrollable-bottom');
      }
    } else {
      element.classList.remove('scrollable-top', 'scrollable-bottom');
    }
  }, []);

  // Resetear índice del carrusel cuando cambia la respuesta
  useEffect(() => {
    if (response) {
      const parsed = parseResponseSections(response);
      if (parsed && parsed.sections) {
        const sectionKeys = Object.keys(parsed.sections);
        if (sectionKeys.length > 0) {
          // Asegurar que el índice esté dentro del rango válido
          if (carouselIndex >= sectionKeys.length) {
            setCarouselIndex(0);
          }
        } else {
          // Si no hay secciones, resetear el índice
          setCarouselIndex(0);
        }
      } else {
        // Si no se pueden parsear secciones, resetear el índice
        setCarouselIndex(0);
      }
    }
  }, [response]);

  // Actualizar indicadores de scroll cuando cambia el contenido o el índice
  useEffect(() => {
    if (contentScrollRef.current) {
      // Pequeño delay para asegurar que el DOM se haya actualizado
      setTimeout(() => {
        updateScrollIndicators(contentScrollRef.current);
      }, 100);
      
      const handleScroll = () => {
        updateScrollIndicators(contentScrollRef.current);
      };
      
      const element = contentScrollRef.current;
      element.addEventListener('scroll', handleScroll);
      
      // También verificar al cambiar el tamaño de la ventana
      window.addEventListener('resize', handleScroll);
      
      return () => {
        element.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleScroll);
      };
    }
  }, [response, carouselIndex]);

  // Scroll automático al final del chat cuando hay nuevos mensajes
  useEffect(() => {
    if (messagesEndRef.current && chatContainerRef.current) {
      const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      };
      
      // Pequeño delay para asegurar que el DOM se haya actualizado
      const timeoutId = setTimeout(scrollToBottom, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [response, loading, question]);

  // Manejar navegación del carrusel con teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Solo manejar si estamos en la página de respuesta (no en el formulario)
      if (showForm) return;
      
      const parsed = parseResponseSections(response);
      if (!parsed || !parsed.sections || Object.keys(parsed.sections).length === 0) return;

      // Solo manejar si el usuario no está escribiendo en un input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateCarousel('prev');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateCarousel('next');
      }
    };

    if (response && !showForm) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [response, carouselIndex, showForm]);

  // Memoizar cálculo de días
  const calculateDays = useCallback((departure, returnDate) => {
    if (!departure || !returnDate) return 0;
    const dep = new Date(departure);
    const ret = new Date(returnDate);
    const diffTime = Math.abs(ret - dep);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, []);

  // Memoizar días calculados del formulario
  const calculatedDays = useMemo(() => {
    if (tripType === 'closed' && formData.departureDate && formData.returnDate) {
      return calculateDays(formData.departureDate, formData.returnDate);
    }
    return null;
  }, [tripType, formData.departureDate, formData.returnDate, calculateDays]);

  const handleQuickDurationSelect = (days) => {
    if (!formData.departureDate) {
      // Si no hay fecha de ida, establecerla como hoy
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        departureDate: today
      }));
      // Calcular fecha de regreso
      const returnDate = new Date();
      returnDate.setDate(returnDate.getDate() + days);
      setFormData(prev => ({
        ...prev,
        returnDate: returnDate.toISOString().split('T')[0]
      }));
    } else {
      // Calcular fecha de regreso basada en la fecha de ida
      const departure = new Date(formData.departureDate);
      const returnDate = new Date(departure);
      returnDate.setDate(returnDate.getDate() + days);
      setFormData(prev => ({
        ...prev,
        returnDate: returnDate.toISOString().split('T')[0]
      }));
    }
  };

  const handleModalQuickDurationSelect = (days) => {
    if (!selectedStartDate) {
      // Si no hay fecha de ida, establecerla como hoy
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setSelectedStartDate(today);
      // Calcular fecha de regreso
      const returnDate = new Date(today);
      returnDate.setDate(returnDate.getDate() + days);
      returnDate.setHours(0, 0, 0, 0);
      setSelectedEndDate(returnDate);
    } else {
      // Calcular fecha de regreso basada en la fecha de ida
      const returnDate = new Date(selectedStartDate);
      returnDate.setDate(returnDate.getDate() + days);
      returnDate.setHours(0, 0, 0, 0);
      setSelectedEndDate(returnDate);
      setIsSelectingStart(true);
    }
    setHoverDate(null);
  };

  const toggleTripType = () => {
    if (tripType === 'closed') {
      setTripType('open');
      // Limpiar fecha de regreso para viaje abierto
      setFormData(prev => ({
        ...prev,
        returnDate: ''
      }));
    } else {
      setTripType('closed');
      // Si hay fecha de ida, calcular fecha de regreso (7 días por defecto)
      if (formData.departureDate) {
        const departure = new Date(formData.departureDate);
        const returnDate = new Date(departure);
        returnDate.setDate(returnDate.getDate() + 7);
        setFormData(prev => ({
          ...prev,
          returnDate: returnDate.toISOString().split('T')[0]
        }));
      }
    }
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Funciones para el calendario
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  const getMonthName = (date) => {
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const isDateInRange = (date, start, end) => {
    if (!start || !end) return false;
    return date >= start && date <= end;
  };

  const isDatePast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDateClick = (date) => {
    if (isDatePast(date)) return;

    if (modalTripType === 'one-way') {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
      return;
    }

    if (isSelectingStart || !selectedStartDate) {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
      setIsSelectingStart(false);
    } else {
      if (date < selectedStartDate) {
        setSelectedEndDate(selectedStartDate);
        setSelectedStartDate(date);
        setIsSelectingStart(true);
      } else {
        setSelectedEndDate(date);
        setIsSelectingStart(true);
      }
    }
    setHoverDate(null);
  };

  const handleDateHover = (date) => {
    if (isDatePast(date)) return;
    if (modalTripType === 'one-way') return;
    
    if (!isSelectingStart && selectedStartDate && !selectedEndDate) {
      setHoverDate(date);
    }
  };

  const handleApplyDates = () => {
    if (selectedStartDate) {
      const startDateStr = selectedStartDate.toISOString().split('T')[0];
      const endDateStr = modalTripType === 'round-trip' && selectedEndDate 
        ? selectedEndDate.toISOString().split('T')[0] 
        : '';
      
      setFormData(prev => ({
        ...prev,
        departureDate: startDateStr,
        returnDate: endDateStr
      }));
      
      // Actualizar tripType si es necesario
      if (modalTripType === 'one-way') {
        setTripType('open');
      } else if (modalTripType === 'round-trip' && endDateStr) {
        setTripType('closed');
      }
    }
    setShowDateModal(false);
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    setHoverDate(null);
    setIsSelectingStart(true);
  };

  const getModalDaysCount = () => {
    if (!selectedStartDate) return 0;
    if (modalTripType === 'one-way') return 0;
    if (!selectedEndDate) return 0;
    return calculateDays(
      selectedStartDate.toISOString().split('T')[0],
      selectedEndDate.toISOString().split('T')[0]
    );
  };

  const handleOpenDateModal = () => {
    // Inicializar con fechas existentes si las hay
    if (formData.departureDate) {
      const depDate = new Date(formData.departureDate);
      depDate.setHours(0, 0, 0, 0);
      setSelectedStartDate(depDate);
      // Establecer el mes del calendario basado en la fecha de ida
      setCalendarMonth(new Date(depDate.getFullYear(), depDate.getMonth(), 1));
    } else {
      // Si no hay fecha, mostrar el mes actual
      const today = new Date();
      setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    }
    if (formData.returnDate) {
      const retDate = new Date(formData.returnDate);
      retDate.setHours(0, 0, 0, 0);
      setSelectedEndDate(retDate);
    }
    // Establecer tipo de viaje en el modal basado en tripType
    setModalTripType(tripType === 'open' ? 'one-way' : 'round-trip');
    setIsSelectingStart(true);
    setHoverDate(null);
    setShowDateModal(true);
  };

  const handleCloseDateModal = () => {
    setShowDateModal(false);
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    setHoverDate(null);
    setIsSelectingStart(true);
  };

  const navigateMonth = (direction) => {
    setCalendarMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const renderCalendar = (monthOffset = 0) => {
    const displayDate = new Date(calendarMonth);
    displayDate.setMonth(displayDate.getMonth() + monthOffset);
    displayDate.setDate(1);
    
    const daysInMonth = getDaysInMonth(displayDate);
    const firstDay = getFirstDayOfMonth(displayDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const days = [];
    const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    // Días del mes anterior
    const prevMonth = new Date(displayDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const daysInPrevMonth = getDaysInMonth(prevMonth);
    
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date = new Date(prevMonth);
      date.setDate(day);
      date.setHours(0, 0, 0, 0);
      days.push({ day, date, isCurrentMonth: false });
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(displayDate);
      date.setDate(day);
      date.setHours(0, 0, 0, 0);
      days.push({ day, date, isCurrentMonth: true });
    }

    // Completar hasta 42 días (6 semanas)
    const remainingDays = 42 - days.length;
    const nextMonth = new Date(displayDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(nextMonth);
      date.setDate(day);
      date.setHours(0, 0, 0, 0);
      days.push({ day, date, isCurrentMonth: false });
    }

    return (
      <div className="calendar-month">
        <div className="calendar-weekdays">
          {weekDays.map(day => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
        </div>
        <div className="calendar-days">
          {days.map(({ day, date, isCurrentMonth }, index) => {
            const isPast = isDatePast(date);
            const isStart = selectedStartDate && date.getTime() === selectedStartDate.getTime();
            const isEnd = selectedEndDate && date.getTime() === selectedEndDate.getTime();
            const isInRange = selectedStartDate && selectedEndDate && 
              isDateInRange(date, selectedStartDate, selectedEndDate);
            const isToday = date.getTime() === today.getTime();
            
            // Rango provisional con hover
            let isInHoverRange = false;
            if (hoverDate && selectedStartDate && !selectedEndDate && modalTripType === 'round-trip') {
              if (hoverDate > selectedStartDate) {
                isInHoverRange = date > selectedStartDate && date <= hoverDate;
              } else {
                isInHoverRange = date >= hoverDate && date < selectedStartDate;
              }
            }

            return (
              <div
                key={index}
                className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isPast ? 'past' : ''} ${isStart ? 'start' : ''} ${isEnd ? 'end' : ''} ${isInRange ? 'in-range' : ''} ${isInHoverRange ? 'hover-range' : ''} ${isToday ? 'today' : ''}`}
                onClick={() => !isPast && isCurrentMonth && handleDateClick(date)}
                onMouseEnter={() => !isPast && isCurrentMonth && handleDateHover(date)}
                onMouseLeave={() => setHoverDate(null)}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const handleTravelerChange = (type, delta) => {
    setFormData(prev => {
      const newValue = prev[type] + delta;
      
      // Validaciones
      if (type === 'adults' && newValue < 1) return prev; // Mínimo 1 adulto
      if (type === 'children' && newValue < 0) return prev; // No puede ser negativo
      if (type === 'infants' && newValue < 0) return prev; // No puede ser negativo
      if (type === 'infants' && newValue > 0 && prev.adults === 0) return prev; // Bebés solo si hay adultos
      
      return {
        ...prev,
        [type]: newValue
      };
    });
  };

  const getTotalTravelers = () => {
    return formData.adults + formData.children + formData.infants;
  };

  const formatTravelersSummary = () => {
    const parts = [];
    if (formData.adults > 0) {
      parts.push(`${formData.adults} ${formData.adults === 1 ? 'adulto' : 'adultos'}`);
    }
    if (formData.children > 0) {
      parts.push(`${formData.children} ${formData.children === 1 ? 'niño' : 'niños'}`);
    }
    if (formData.infants > 0) {
      parts.push(`${formData.infants} ${formData.infants === 1 ? 'bebé' : 'bebés'}`);
    }
    if (parts.length === 0) {
      return 'Seleccionar viajeros';
    }
    return parts.join(', ');
  };

  const handleOpenTravelersModal = () => {
    setShowTravelersModal(true);
  };

  const handleCloseTravelersModal = () => {
    setShowTravelersModal(false);
  };

  // Memoizar función de carga de destinos populares
  const loadPopularDestinations = useCallback(async () => {
    // Si ya tenemos destinos populares cargados, no volver a cargar
    if (popularDestinations.length > 0) {
      return popularDestinations;
    }

    setLoadingDestinations(true);
    try {
      const result = await axios.get(`${API_URL}/api/destinations/popular`);
      if (result.data && result.data.destinations) {
        startTransition(() => {
          setPopularDestinations(result.data.destinations);
        });
        return result.data.destinations;
      }
    } catch (error) {
      console.error('Error al cargar destinos populares:', error);
      // En caso de error, usar destinos por defecto
      const defaultDestinations = [
        'París, Francia',
        'Tokio, Japón',
        'Nueva York, Estados Unidos',
        'Bali, Indonesia',
        'Barcelona, España'
      ];
      startTransition(() => {
        setPopularDestinations(defaultDestinations);
      });
      return defaultDestinations;
    } finally {
      setLoadingDestinations(false);
    }
    return [];
  }, [popularDestinations.length]);

  // Memoizar función de búsqueda de destinos
  const searchDestinations = useCallback(async (query) => {
    if (!query || !query.trim()) {
      return [];
    }

    setLoadingSearch(true);
    try {
      const result = await axios.post(`${API_URL}/api/destinations/search`, {
        query: query.trim()
      });
      if (result.data && result.data.destinations) {
        return result.data.destinations;
      }
    } catch (error) {
      console.error('Error al buscar destinos:', error);
      return [];
    } finally {
      setLoadingSearch(false);
    }
    return [];
  }, []);

  // Función para obtener información en tiempo real
  const fetchRealtimeInfo = useCallback(async (destination) => {
    if (!destination || !destination.trim()) {
      return;
    }

    setLoadingRealtimeInfo(true);
    try {
      const result = await axios.post(`${API_URL}/api/realtime-info`, {
        destination: destination.trim()
      });
      if (result.data) {
        setRealtimeInfo(result.data);
        console.log('📊 Información en tiempo real recibida:', result.data);
      }
    } catch (error) {
      console.error('Error al obtener información en tiempo real:', error);
      setRealtimeInfo(null);
    } finally {
      setLoadingRealtimeInfo(false);
    }
  }, []);

  // Función para cargar el historial de conversación
  const loadConversationHistory = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      const result = await axios.post(`${API_URL}/api/conversation/history`, {
        session_id: sessionId
      });
      if (result.data && result.data.messages) {
        setConversationHistory(result.data.messages);
      }
    } catch (error) {
      console.error('Error al cargar historial de conversación:', error);
    }
  }, [sessionId]);

  // Funciones para manejar favoritos
  const loadFavorites = useCallback(() => {
    try {
      const stored = localStorage.getItem('viajeia_favorites');
      if (stored) {
        const parsed = JSON.parse(stored);
        setFavorites(parsed);
        console.log('✅ [FAVORITES] Favoritos cargados:', parsed.length);
      }
    } catch (error) {
      console.error('❌ [FAVORITES] Error al cargar favoritos:', error);
      setFavorites([]);
    }
  }, []);

  const saveFavorite = useCallback((favorite) => {
    try {
      const newFavorites = [...favorites, favorite];
      localStorage.setItem('viajeia_favorites', JSON.stringify(newFavorites));
      setFavorites(newFavorites);
      console.log('✅ [FAVORITES] Favorito guardado:', favorite.destination);
      return true;
    } catch (error) {
      console.error('❌ [FAVORITES] Error al guardar favorito:', error);
      // Si hay error de almacenamiento (probablemente por tamaño), intentar limpiar favoritos antiguos
      if (error.name === 'QuotaExceededError') {
        alert('No se pudo guardar el favorito. El almacenamiento está lleno. Intenta eliminar algunos favoritos antiguos.');
      }
      return false;
    }
  }, [favorites]);

  const removeFavorite = useCallback((id) => {
    try {
      const newFavorites = favorites.filter(fav => fav.id !== id);
      localStorage.setItem('viajeia_favorites', JSON.stringify(newFavorites));
      setFavorites(newFavorites);
      console.log('✅ [FAVORITES] Favorito eliminado:', id);
    } catch (error) {
      console.error('❌ [FAVORITES] Error al eliminar favorito:', error);
    }
  }, [favorites]);

  const isFavorite = useCallback((destination) => {
    if (!destination) return false;
    return favorites.some(fav => 
      fav.destination.toLowerCase().trim() === destination.toLowerCase().trim()
    );
  }, [favorites]);

  const generatePDFBlob = useCallback(async (sessionId, departureDate, returnDate) => {
    try {
      const params = new URLSearchParams({
        session_id: sessionId
      });
      
      if (departureDate) {
        params.append('departure_date', departureDate);
      }
      if (returnDate) {
        params.append('return_date', returnDate);
      }

      const url = `${API_URL}/api/itinerary/pdf?${params.toString()}`;
      const response = await axios.get(url, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Obtener nombre del archivo
      const contentDisposition = response.headers['content-disposition'] || 
                                 response.headers['Content-Disposition'];
      let filename = 'itinerario_viajeia.pdf';
      
      if (contentDisposition) {
        let filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        } else {
          filenameMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/);
          if (filenameMatch) {
            filename = decodeURIComponent(filenameMatch[1]);
          } else {
            filenameMatch = contentDisposition.match(/filename=([^;]+)/);
            if (filenameMatch) {
              filename = filenameMatch[1].trim().replace(/['"]/g, '');
            }
          }
        }
      }

      // Convertir blob a base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result.split(',')[1]; // Remover el prefijo data:application/pdf;base64,
          resolve({ base64data, filename, blob });
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('❌ [FAVORITES] Error al generar PDF:', error);
      throw error;
    }
  }, []);

  const autoSaveFavorite = useCallback(async () => {
    // Solo guardar si hay destino, respuesta y sessionId
    if (!formData.destination || !response || !sessionId) {
      console.log('⚠️ [FAVORITES] No se puede guardar automáticamente: faltan datos');
      return;
    }

    // Verificar si ya existe este favorito
    if (isFavorite(formData.destination)) {
      console.log('ℹ️ [FAVORITES] El destino ya está en favoritos, no se guarda automáticamente');
      return;
    }

    try {
      console.log('💾 [FAVORITES] Guardando favorito automáticamente...');
      
      // Generar PDF
      const pdfData = await generatePDFBlob(
        sessionId,
        formData.departureDate,
        formData.returnDate
      );

      const favorite = {
        id: `${Date.now()}_${formData.destination.replace(/\s+/g, '_')}`,
        destination: formData.destination,
        departureDate: formData.departureDate || null,
        returnDate: formData.returnDate || null,
        pdfBlob: pdfData.base64data,
        pdfFilename: pdfData.filename,
        savedAt: new Date().toISOString(),
        sessionId: sessionId
      };

      saveFavorite(favorite);
      console.log('✅ [FAVORITES] Favorito guardado automáticamente');
    } catch (error) {
      console.error('❌ [FAVORITES] Error al guardar favorito automáticamente:', error);
    }
  }, [formData, response, sessionId, isFavorite, generatePDFBlob, saveFavorite]);

  const handleDeleteFavorite = useCallback((favorite) => {
    setFavoriteToDelete(favorite);
    setDeleteAllFavorites(false);
    setShowDeleteModal(true);
  }, []);

  const saveCurrentAsFavorite = useCallback(async () => {
    if (!formData.destination || !response || !sessionId) {
      return;
    }

    // Si ya es favorito, mostrar modal de confirmación para eliminarlo
    if (isFavorite(formData.destination)) {
      const existingFavorite = favorites.find(fav => 
        fav.destination.toLowerCase().trim() === formData.destination.toLowerCase().trim()
      );
      if (existingFavorite) {
        handleDeleteFavorite(existingFavorite);
      }
      return;
    }

    try {
      console.log('💾 [FAVORITES] Guardando favorito manualmente...');
      
      // Generar PDF
      const pdfData = await generatePDFBlob(
        sessionId,
        formData.departureDate,
        formData.returnDate
      );

      const favorite = {
        id: `${Date.now()}_${formData.destination.replace(/\s+/g, '_')}`,
        destination: formData.destination,
        departureDate: formData.departureDate || null,
        returnDate: formData.returnDate || null,
        pdfBlob: pdfData.base64data,
        pdfFilename: pdfData.filename,
        savedAt: new Date().toISOString(),
        sessionId: sessionId
      };

      saveFavorite(favorite);
    } catch (error) {
      console.error('❌ [FAVORITES] Error al guardar favorito manualmente:', error);
    }
  }, [formData, response, sessionId, isFavorite, favorites, generatePDFBlob, saveFavorite, handleDeleteFavorite]);

  const handleDeleteAllFavorites = useCallback(() => {
    setFavoriteToDelete(null);
    setDeleteAllFavorites(true);
    setShowDeleteModal(true);
  }, []);

  const confirmDeleteFavorite = useCallback(() => {
    if (deleteAllFavorites) {
      localStorage.removeItem('viajeia_favorites');
      setFavorites([]);
      setShowDeleteModal(false);
      setDeleteAllFavorites(false);
      setShowFavorites(false);
    } else if (favoriteToDelete) {
      removeFavorite(favoriteToDelete.id);
      setShowDeleteModal(false);
      setFavoriteToDelete(null);
    }
  }, [favoriteToDelete, deleteAllFavorites, removeFavorite]);

  const cancelDeleteFavorite = useCallback(() => {
    setShowDeleteModal(false);
    setFavoriteToDelete(null);
    setDeleteAllFavorites(false);
  }, []);

  const downloadFavoritePDF = useCallback((favorite) => {
    try {
      // Convertir base64 a blob
      const byteCharacters = atob(favorite.pdfBlob);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      // Crear enlace de descarga
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = favorite.pdfFilename || 'itinerario_viajeia.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      console.log('✅ [FAVORITES] PDF descargado:', favorite.pdfFilename);
    } catch (error) {
      console.error('❌ [FAVORITES] Error al descargar PDF:', error);
      alert('Error al descargar el PDF. Por favor, intenta de nuevo.');
    }
  }, []);

  const loadFavoriteToForm = useCallback((favorite) => {
    setFormData(prev => ({
      ...prev,
      destination: favorite.destination,
      departureDate: favorite.departureDate || '',
      returnDate: favorite.returnDate || ''
    }));
    setShowFavorites(false);
    setShowForm(true);
    console.log('✅ [FAVORITES] Favorito cargado al formulario:', favorite.destination);
  }, []);

  // Cargar favoritos al iniciar
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateDestination(formData.destination)) {
      return;
    }
    
    if (!formData.destination || !formData.departureDate || !formData.budget || !formData.preference) {
      return;
    }

    // Validar que si es viaje cerrado, tenga fecha de regreso
    if (tripType === 'closed' && !formData.returnDate) {
      return;
    }

    // Validar que haya al menos un adulto
    if (formData.adults < 1) {
      return;
    }
    
    const days = tripType === 'closed' ? calculateDays(formData.departureDate, formData.returnDate) : null;
    const travelersInfo = `Viajamos ${formData.adults} ${formData.adults === 1 ? 'adulto' : 'adultos'}${formData.children > 0 ? `, ${formData.children} ${formData.children === 1 ? 'niño' : 'niños'}` : ''}${formData.infants > 0 ? ` y ${formData.infants} ${formData.infants === 1 ? 'bebé' : 'bebés'}` : ''}`;
    
    // Pre-llenar la pregunta con la información del formulario
    let preFilledQuestion;
    if (tripType === 'closed') {
      preFilledQuestion = `Quiero viajar a ${formData.destination} del ${formData.departureDate} al ${formData.returnDate} (${days} días) con un presupuesto de ${formData.budget}. ${travelersInfo}. Prefiero ${formData.preference}.`;
    } else {
      preFilledQuestion = `Quiero viajar a ${formData.destination} desde el ${formData.departureDate} (viaje abierto, sin fecha de regreso definida) con un presupuesto de ${formData.budget}. ${travelersInfo}. Prefiero ${formData.preference}.`;
    }
    
    // Crear un objeto con los datos del formulario para comparar
    const currentFormData = {
      destination: formData.destination,
      departureDate: formData.departureDate,
      returnDate: formData.returnDate,
      adults: formData.adults,
      children: formData.children,
      infants: formData.infants,
      budget: formData.budget,
      preference: formData.preference,
      tripType: tripType
    };
    
    // Comparar con los datos anteriores
    const hasChanged = !lastFormDataRef.current || 
      JSON.stringify(currentFormData) !== JSON.stringify(lastFormDataRef.current) ||
      tripType !== lastTripTypeRef.current;
    
    // Verificar si el destino cambió específicamente
    const destinationChanged = !lastFormDataRef.current || 
      (lastFormDataRef.current.destination !== currentFormData.destination);
    
    // Verificar si el mensaje ya existe en el historial para evitar duplicados
    const messageExists = chatMessages.some(msg => 
      msg.role === 'user' && msg.content === preFilledQuestion.trim()
    );
    
    // Si el destino cambió, limpiar el historial de chat y datos relacionados
    if (destinationChanged) {
      console.log('🔄 [FORMULARIO] Destino cambió, limpiando historial de chat');
      setChatMessages([{ role: 'user', content: preFilledQuestion.trim() }]); // Limpiar y agregar nuevo mensaje
      setResponse('');
      setWeather(null);
      setPhotos(null);
      setRealtimeInfo(null);
      setCarouselIndex(0);
    } else if (!messageExists) {
      // Si el destino no cambió y el mensaje no existe, agregar el mensaje al historial existente
      setChatMessages(prev => [...prev, { role: 'user', content: preFilledQuestion.trim() }]);
    } else {
      console.log('ℹ️ [FORMULARIO] El mensaje ya existe en el historial, no se duplica');
    }
    setQuestion(''); // Limpiar el input
    setShowForm(false);
    
    // IMPORTANTE: El caché solo se usa si:
    // 1. Los datos del formulario NO han cambiado
    // 2. Ya existe una respuesta previa
    // 3. Es una petición desde el FORMULARIO (no desde el chat)
    if (!hasChanged && response && response.trim().length > 0) {
      console.log('💾 [FORMULARIO] Usando respuesta en caché (datos del formulario no cambiaron)');
      console.log('⚠️ [FORMULARIO] NO se consulta a Gemini - usando respuesta previa');
      // Verificar si la respuesta ya está en el timeline para evitar duplicados
      const responseExists = chatMessages.some(msg => 
        msg.role === 'assistant' && msg.content === response
      );
      
      if (!responseExists) {
        // Agregar la respuesta existente al timeline del chat solo si no existe
        setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
      } else {
        console.log('ℹ️ [FORMULARIO] La respuesta ya está en el timeline, no se duplica');
      }
      // No hacer petición, solo mostrar la respuesta existente
      return;
    }
    
    console.log('🔄 [FORMULARIO] Datos del formulario cambiaron o no hay respuesta previa');
    console.log('✅ [FORMULARIO] Se consultará a Gemini');
    
    // Si hay cambios o no hay respuesta previa, hacer la petición
    setLoading(true);
    setResponse('');
    setWeather(null);
    setPhotos(null);
    setRealtimeInfo(null);
    setCarouselIndex(0);
    
    // Guardar los datos actuales para la próxima comparación
    lastFormDataRef.current = currentFormData;
    lastTripTypeRef.current = tripType;

    try {
      const result = await axios.post(`${API_URL}/api/travel`, {
        question: preFilledQuestion.trim(),
        destination: formData.destination,  // Enviar destino del formulario
        session_id: sessionId  // Incluir session_id para mantener historial
      });

      // Actualizar session_id si se devolvió uno nuevo
      if (result.data.session_id) {
        setSessionId(result.data.session_id);
        localStorage.setItem('viajeia_session_id', result.data.session_id);
      }

      setResponse(result.data.answer);
      setWeather(result.data.weather || null);
      setPhotos(result.data.photos || null);
      
      // Agregar la respuesta del asistente al timeline del chat
      setChatMessages(prev => [...prev, { role: 'assistant', content: result.data.answer }]);
      
      console.log('🌤️ Clima recibido (formulario):', result.data.weather);
      console.log('📸 Fotos recibidas (formulario):', result.data.photos);
      
      // Actualizar historial de conversación
      if (sessionId) {
        loadConversationHistory();
      }
      
      // Guardar automáticamente como favorito
      if (result.data.answer && formData.destination) {
        // Usar setTimeout para no bloquear la UI
        setTimeout(() => {
          autoSaveFavorite();
        }, 1000);
      }
      
      // Obtener información en tiempo real
      if (formData.destination) {
        fetchRealtimeInfo(formData.destination);
      }
    } catch (error) {
      console.error('Error:', error);
      let errorMessage = 'Lo siento, hubo un error al procesar tu solicitud. Por favor, intenta de nuevo.';
      
      if (error.response) {
        // El servidor respondió con un código de error
        errorMessage = error.response.data?.detail || error.response.data?.message || errorMessage;
      } else if (error.request) {
        // La solicitud se hizo pero no se recibió respuesta
        errorMessage = 'No se pudo conectar con el servidor. Por favor, verifica que el backend esté corriendo.';
      }
      
      setResponse(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Validación de fechas: si se cambia la fecha de ida y la de regreso es anterior, ajustarla
    if (name === 'departureDate' && tripType === 'closed' && formData.returnDate) {
      const newDeparture = new Date(value);
      const currentReturn = new Date(formData.returnDate);
      if (currentReturn < newDeparture) {
        // Ajustar fecha de regreso para que sea igual o posterior a la de ida
        const adjustedReturn = new Date(newDeparture);
        adjustedReturn.setDate(adjustedReturn.getDate() + 7); // Por defecto 7 días después
        setFormData(prev => ({
          ...prev,
          [name]: value,
          returnDate: adjustedReturn.toISOString().split('T')[0]
        }));
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Lógica de autocompletado para destino
    if (name === 'destination') {
      setDestinationError('');
      
      // Limpiar timeout anterior si existe
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      if (value.trim().length > 0) {
        // Primero, filtrar destinos populares que coincidan (búsqueda rápida local)
        const filteredPopular = popularDestinations.filter(dest =>
          dest.toLowerCase().includes(value.toLowerCase())
        );
        
        // Si hay coincidencias en destinos populares, mostrarlas inmediatamente
        if (filteredPopular.length > 0) {
          startTransition(() => {
            setDestinationSuggestions(filteredPopular.slice(0, 5));
            setShowSuggestions(true);
          });
        }
        
        // Luego, buscar con Gemini usando debounce (500ms)
        searchTimeoutRef.current = setTimeout(async () => {
          const searchResults = await searchDestinations(value);
          if (searchResults.length > 0) {
            // Combinar resultados de búsqueda con destinos populares filtrados
            const combined = [...new Set([...filteredPopular, ...searchResults])].slice(0, 5);
            startTransition(() => {
              setDestinationSuggestions(combined);
              setShowSuggestions(true);
            });
          } else if (filteredPopular.length === 0) {
            // Si no hay resultados de ninguna fuente, ocultar sugerencias
            startTransition(() => {
              setDestinationSuggestions([]);
              setShowSuggestions(false);
            });
          }
        }, 500);
      } else {
        // Si no hay texto, mostrar los destinos populares (si están cargados)
        if (popularDestinations.length > 0) {
          startTransition(() => {
            setDestinationSuggestions(popularDestinations.slice(0, 5));
            setShowSuggestions(true);
          });
        } else {
          // Si no hay destinos cargados, cargarlos
          loadPopularDestinations().then(destinations => {
            if (destinations.length > 0) {
              startTransition(() => {
                setDestinationSuggestions(destinations.slice(0, 5));
                setShowSuggestions(true);
              });
            }
          });
        }
      }
    }
  };

  // Memoizar función de selección de destino
  const handleDestinationSelect = useCallback((destination) => {
    // Actualizar el formulario inmediatamente
    startTransition(() => {
      setFormData(prev => ({
        ...prev,
        destination: destination
      }));
      setDestinationSuggestions([]);
      setShowSuggestions(false);
      setDestinationError('');
    });
    
    // El destino ya fue pre-procesado cuando se buscó en /api/destinations/search
    // La información del clima ya está en cache del backend, lista para cuando se envíe el formulario
    console.log(`✅ Destino seleccionado: ${destination} (ya pre-procesado en búsqueda)`);
  }, []);

  const validateDestination = (value) => {
    if (!value.trim()) {
      setDestinationError('Por favor, ingresa un destino');
      return false;
    }
    
    // Validar que solo contenga letras, espacios, comas y caracteres especiales comunes
    const validPattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s,.'-]+$/;
    if (!validPattern.test(value)) {
      setDestinationError('El destino solo puede contener letras y caracteres válidos');
      return false;
    }

    setDestinationError('');
    return true;
  };

  const handleDestinationBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
      if (formData.destination) {
        validateDestination(formData.destination);
        // El destino ya fue pre-procesado cuando se buscó en /api/destinations/search
        // Si el usuario escribió manualmente, se procesará cuando se envíe el formulario
      }
    }, 200);
  };

  // Función para renderizar contenido de secciones con formato mejorado
  // El backend envía contenido en formato JSON, cada elemento del array es una recomendación
  const renderSectionContent = (content, sectionName) => {
    if (!content) {
      console.warn(`⚠️ Contenido vacío para sección: ${sectionName}`);
      return <div className="empty-section">No hay contenido disponible para esta sección.</div>;
    }
    
    // Dividir por líneas - cada línea es una recomendación del array JSON
    const allLines = content.split('\n');
    const lines = allLines.filter(line => line.trim());
    
    console.log(`📋 Renderizando sección "${sectionName}":`);
    console.log(`  - Total recomendaciones recibidas: ${lines.length}`);
    console.log(`  - Contenido completo:`, content);
    
    if (lines.length === 0) {
      console.warn(`⚠️ No hay recomendaciones para sección: ${sectionName}`);
      return <div className="empty-section">No hay recomendaciones disponibles para esta sección.</div>;
    }
    
    return (
      <div className="section-recommendations">
        {lines.map((line, index) => {
          const trimmedLine = line.trim();
          if (!trimmedLine) return null;
          
          console.log(`  ✓ Renderizando recomendación ${index + 1}: "${trimmedLine.substring(0, 50)}..."`);
          
          // Detectar si tiene formato "Subtítulo: descripción" o "Título - descripción"
          // Mejorar regex para capturar diferentes formatos comunes
          // Primero intentar con dos puntos (más específico)
          const subtitleMatch = trimmedLine.match(/^([^:]+?):\s+(.+)$/);
          
          if (subtitleMatch) {
            // Formato con subtítulo (ej: "Transporte: usar metro")
            const subtitle = subtitleMatch[1].trim();
            const description = subtitleMatch[2].trim();
            
            // Validar que el subtítulo no sea muy largo (probablemente no es un subtítulo)
            if (subtitle.length > 50) {
              // Probablemente no es un subtítulo, intentar con guión
              const dashMatch = trimmedLine.match(/^([^-]+?)\s*-\s*(.+)$/);
              if (dashMatch) {
                const title = dashMatch[1].trim();
                const desc = dashMatch[2].trim();
                return (
                  <div key={index} className="recommendation-item">
                    <div className="recommendation-bullet">•</div>
                    <div className="recommendation-content">
                      <strong className="recommendation-subtitle">{title}</strong>
                      <span className="recommendation-description"> - {desc}</span>
                    </div>
                  </div>
                );
              }
              // Si no coincide con guión, mostrar como texto normal
              return (
                <div key={index} className="recommendation-item">
                  <div className="recommendation-bullet">•</div>
                  <div className="recommendation-content">
                    {trimmedLine}
                  </div>
                </div>
              );
            }
            
            return (
              <div key={index} className="recommendation-item">
                <div className="recommendation-bullet">•</div>
                <div className="recommendation-content">
                  <strong className="recommendation-subtitle">{subtitle}:</strong>
                  <span className="recommendation-description"> {description}</span>
                </div>
              </div>
            );
          }
          
          // Intentar formato con guión (debe tener al menos un espacio antes y después del guión)
          const dashMatch = trimmedLine.match(/^(.+?)\s+-\s+(.+)$/);
          if (dashMatch) {
            const title = dashMatch[1].trim();
            const description = dashMatch[2].trim();
            
            // Validar que el título no sea muy largo (probablemente no es un título)
            if (title.length > 80) {
              // Probablemente no es un título, mostrar como texto normal
              return (
                <div key={index} className="recommendation-item">
                  <div className="recommendation-bullet">•</div>
                  <div className="recommendation-content">
                    {trimmedLine}
                  </div>
                </div>
              );
            }
            
            return (
              <div key={index} className="recommendation-item">
                <div className="recommendation-bullet">•</div>
                <div className="recommendation-content">
                  <strong className="recommendation-subtitle">{title}</strong>
                  <span className="recommendation-description"> - {description}</span>
                </div>
              </div>
            );
          }
          
          // Formato simple - mostrar toda la recomendación
          return (
            <div key={index} className="recommendation-item">
              <div className="recommendation-bullet">•</div>
              <div className="recommendation-content">
                {trimmedLine}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Función para renderizar texto introductorio/final (sin viñetas)
  const renderPlainText = (text) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    return lines.map((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return <br key={index} />;
      
      // Procesar markdown básico si existe
      const parts = [];
      let lastIndex = 0;
      const boldRegex = /\*\*([^*]+)\*\*/g;
      let match;
      let key = 0;
      
      while ((match = boldRegex.exec(trimmedLine)) !== null) {
        if (match.index > lastIndex) {
          parts.push(
            <span key={`text-${key++}`}>
              {trimmedLine.substring(lastIndex, match.index)}
            </span>
          );
        }
        parts.push(
          <strong key={`bold-${key++}`}>
            {match[1]}
          </strong>
        );
        lastIndex = match.index + match[0].length;
      }
      
      if (lastIndex < trimmedLine.length) {
        parts.push(
          <span key={`text-${key++}`}>
            {trimmedLine.substring(lastIndex)}
          </span>
        );
      }
      
      if (parts.length === 0) {
        parts.push(<span key="text-0">{trimmedLine}</span>);
      }
      
      return (
        <p key={index} style={{ marginBottom: '12px', lineHeight: '1.8' }}>
          {parts}
        </p>
      );
    });
  };


  // Función para obtener el icono según la sección
  const getSectionIcon = (sectionName) => {
    const iconMap = {
      'ALOJAMIENTO': Hotel,
      'COMIDA LOCAL': UtensilsCrossed,
      'LUGARES IMPERDIBLES': MapPin,
      'CONSEJOS LOCALES': Lightbulb,
      'ESTIMACIÓN DE COSTOS': DollarSign
    };
    
    const IconComponent = iconMap[sectionName] || MapPin;
    return <IconComponent size={20} />;
  };

  // Función para navegar el carrusel
  const navigateCarousel = (direction, resultId = null, currentContent = null) => {
    // Si se proporciona resultId y currentContent, usar el contenido específico del mensaje
    if (resultId && currentContent) {
      const parsed = parseResponseSections(currentContent);
      if (!parsed || !parsed.sections) return;
      
      const sectionKeys = Object.keys(parsed.sections);
      if (sectionKeys.length === 0) return;
      
      setCarouselDirection(direction === 'next' ? 'right' : 'left');
      
      setCarouselIndices((prevIndices) => {
        const currentIndex = prevIndices[resultId] || 0;
        let newIndex;
        if (direction === 'next') {
          newIndex = (currentIndex + 1) % sectionKeys.length;
        } else {
          newIndex = (currentIndex - 1 + sectionKeys.length) % sectionKeys.length;
        }
        
        // Hacer scroll al inicio cuando se cambia de página
        setTimeout(() => {
          const scrollRef = sectionScrollRefs.current[resultId];
          if (scrollRef && scrollRef.current) {
            scrollRef.current.scrollTop = 0;
          }
        }, 0);
        
        return {
          ...prevIndices,
          [resultId]: newIndex
        };
      });
      return;
    }
    
    // Código legacy para compatibilidad
    if (!response) return;
    
    const parsed = parseResponseSections(response);
    if (!parsed || !parsed.sections) return;

    const sectionKeys = Object.keys(parsed.sections);
    if (sectionKeys.length === 0) return;

    setCarouselDirection(direction === 'next' ? 'right' : 'left');
    
    setCarouselIndex((prevIndex) => {
      if (direction === 'next') {
        return (prevIndex + 1) % sectionKeys.length;
      } else {
        return (prevIndex - 1 + sectionKeys.length) % sectionKeys.length;
      }
    });
  };

  // Función para alternar expansión de resultados
  const toggleExpandResult = (resultId) => {
    setExpandedResults(prev => ({
      ...prev,
      [resultId]: !prev[resultId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!question.trim()) {
      console.log('⚠️ [CHAT] Pregunta vacía, no se envía');
      return;
    }

    const currentQuestion = question.trim();
    
    // Agregar el mensaje del usuario a la conversación solo cuando se envía
    setChatMessages(prev => [...prev, { role: 'user', content: currentQuestion }]);
    
    // Limpiar el input después de agregar el mensaje
    setQuestion('');
    
    console.log('🚀 [CHAT] ========================================');
    console.log('🚀 [CHAT] Usuario hizo click en "Planificar mi viaje"');
    console.log('🚀 [CHAT] Nueva pregunta enviada:', currentQuestion);
    console.log('📋 [CHAT] Session ID:', sessionId);
    console.log('📋 [CHAT] Estado anterior - Response:', response ? response.substring(0, 100) + '...' : 'vacío');
    console.log('⚠️ [CHAT] IMPORTANTE: Esta es una pregunta de CHAT - SIEMPRE se consulta a Gemini (NO usa caché)');
    console.log('✅ [CHAT] Consulta a Gemini iniciada por acción del usuario (click en botón)');
    console.log('🚀 [CHAT] ========================================');

    // IMPORTANTE: Las preguntas del chat SIEMPRE van directo a Gemini, nunca usan caché
    // Limpiar solo response y photos (específicos de la pregunta)
    // MANTENER weather y realtimeInfo (relacionados con el destino) si ya existen
    setLoading(true);
    setResponse('');
    setPhotos(null);
    setCarouselIndex(0);
    // NO limpiar weather ni realtimeInfo - se mantienen porque son específicos del destino
    console.log('🧹 [CHAT] Limpiando response y photos para nueva pregunta');
    console.log('✅ [CHAT] MANTENIENDO weather y realtimeInfo del destino');

    try {
      console.log('📤 [CHAT] Enviando petición a /api/travel con:', {
        question: currentQuestion,
        session_id: sessionId,
        destination: null,  // No hay destino del formulario en modo chat
        is_chat_question: true  // Marca que es pregunta de chat
      });

      const result = await axios.post(`${API_URL}/api/travel`, {
        question: currentQuestion,
        session_id: sessionId,  // Incluir session_id para mantener historial
        destination: null  // Explícitamente null para indicar que NO es del formulario
      });

      console.log('✅ [CHAT] Respuesta recibida del servidor');
      console.log('📦 [CHAT] Datos recibidos:', {
        hasAnswer: !!result.data.answer,
        answerLength: result.data.answer?.length || 0,
        hasWeather: !!result.data.weather,
        hasPhotos: !!result.data.photos,
        sessionId: result.data.session_id,
        requiresConfirmation: result.data.requires_confirmation,
        detectedDestination: result.data.detected_destination
      });

      // ============================================================
      // Confirmación interactiva: El mensaje de confirmación se muestra en el chat
      // El usuario responderá en el siguiente mensaje y el backend lo procesará automáticamente
      // ============================================================
      if (result.data.response_format === "confirmation") {
        console.log('❓ [CHAT] Mensaje de confirmación recibido (se mostrará en el chat)');
        console.log('📍 [CHAT] Destino detectado:', result.data.detected_destination);
        console.log('📍 [CHAT] Destino actual:', result.data.current_destination);
        // El mensaje se mostrará normalmente en el chat, no se requiere acción especial
      }

      // Actualizar session_id si se devolvió uno nuevo
      if (result.data.session_id) {
        console.log('🔄 [CHAT] Actualizando session_id:', result.data.session_id);
        setSessionId(result.data.session_id);
        localStorage.setItem('viajeia_session_id', result.data.session_id);
      }

      console.log('📝 [CHAT] Respuesta completa (primeros 200 caracteres):', result.data.answer?.substring(0, 200));
      
      // Actualizar response y photos con la nueva respuesta
      setResponse(result.data.answer);
      setPhotos(result.data.photos || null);
      
      // Agregar la respuesta del asistente a la conversación
      setChatMessages(prev => [...prev, { role: 'assistant', content: result.data.answer }]);
      
      // Actualizar weather solo si viene nueva información, sino mantener la anterior
      if (result.data.weather) {
        console.log('🌤️ [CHAT] Actualizando weather con nueva información');
        setWeather(result.data.weather);
      } else {
        console.log('✅ [CHAT] MANTENIENDO weather anterior (no hay nueva información)');
        // No hacer nada, mantener weather anterior
      }
      
      console.log('🌤️ [CHAT] Clima recibido:', result.data.weather ? 'nuevo clima' : 'sin clima (manteniendo anterior)');
      console.log('📸 [CHAT] Fotos recibidas:', result.data.photos ? `${result.data.photos.length} fotos` : 'ninguna');
      console.log('✅ [CHAT] MANTENIENDO realtimeInfo anterior (específico del destino)');
      
      // Actualizar historial de conversación
      if (sessionId || result.data.session_id) {
        console.log('📚 [CHAT] Cargando historial de conversación...');
        loadConversationHistory();
      }
      
      // Guardar automáticamente como favorito si hay destino y respuesta
      const currentSessionId = result.data.session_id || sessionId;
      if (result.data.answer && formData.destination && currentSessionId) {
        // Usar setTimeout para no bloquear la UI
        setTimeout(() => {
          autoSaveFavorite();
        }, 1000);
      }
      
      console.log('✅ [CHAT] Proceso completado exitosamente');
      
    } catch (error) {
      console.error('❌ [CHAT] Error al procesar la pregunta:', error);
      console.error('❌ [CHAT] Detalles del error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = 'Lo siento, hubo un error al procesar tu solicitud. Por favor, intenta de nuevo.';
      
      if (error.response) {
        // El servidor respondió con un código de error
        errorMessage = error.response.data?.detail || error.response.data?.message || errorMessage;
        console.error('❌ [CHAT] Error del servidor:', errorMessage);
      } else if (error.request) {
        // La solicitud se hizo pero no se recibió respuesta
        errorMessage = 'No se pudo conectar con el servidor. Por favor, verifica que el backend esté corriendo.';
        console.error('❌ [CHAT] No se recibió respuesta del servidor');
      }
      
      setResponse(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
      console.log('🏁 [CHAT] Proceso finalizado, loading = false');
    }
  };

  // Función para descargar el itinerario en PDF
  const handleDownloadItinerary = async () => {
    if (!sessionId) {
      alert('No hay una conversación activa para exportar.');
      return;
    }

    try {
      console.log('📄 [PDF] Iniciando descarga de itinerario PDF');
      console.log('📋 [PDF] Session ID:', sessionId);
      console.log('📅 [PDF] Fechas:', {
        departure: formData.departureDate || 'No especificada',
        return: formData.returnDate || 'No especificada'
      });

      // Construir URL con parámetros
      const params = new URLSearchParams({
        session_id: sessionId
      });
      
      if (formData.departureDate) {
        params.append('departure_date', formData.departureDate);
      }
      if (formData.returnDate) {
        params.append('return_date', formData.returnDate);
      }

      const url = `${API_URL}/api/itinerary/pdf?${params.toString()}`;
      
      console.log('📤 [PDF] Solicitando PDF desde:', url);

      // Hacer la petición
      const response = await axios.get(url, {
        responseType: 'blob', // Importante para descargar archivos
      });

      console.log('✅ [PDF] PDF recibido, tamaño:', response.data.size, 'bytes');

      // Crear un enlace temporal para descargar
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Obtener nombre del archivo del header o usar uno por defecto
      const contentDisposition = response.headers['content-disposition'] || response.headers['Content-Disposition'];
      let filename = 'itinerario_viajeia.pdf';
      
      console.log('📋 [PDF] Content-Disposition header:', contentDisposition);
      
      if (contentDisposition) {
        // Intentar múltiples formatos de Content-Disposition
        // Formato 1: filename="nombre.pdf"
        let filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        } else {
          // Formato 2: filename*=UTF-8''nombre.pdf
          filenameMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/);
          if (filenameMatch) {
            filename = decodeURIComponent(filenameMatch[1]);
          } else {
            // Formato 3: filename=nombre.pdf (sin comillas)
            filenameMatch = contentDisposition.match(/filename=([^;]+)/);
            if (filenameMatch) {
              filename = filenameMatch[1].trim().replace(/['"]/g, '');
            }
          }
        }
      }
      
      console.log('📄 [PDF] Nombre del archivo extraído:', filename);
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      console.log('✅ [PDF] Descarga completada:', filename);
    } catch (error) {
      console.error('❌ [PDF] Error al descargar PDF:', error);
      let errorMessage = 'Error al generar el PDF. Por favor, intenta de nuevo.';
      
      if (error.response) {
        errorMessage = error.response.data?.detail || error.response.data?.message || errorMessage;
      } else if (error.request) {
        errorMessage = 'No se pudo conectar con el servidor. Por favor, verifica que el backend esté corriendo.';
      }
      
      alert(errorMessage);
    }
  };

  if (showForm) {
    return (
      <div className="App">
        <div className="container">
          <header className="header">
            <h1 className="title">ViajeIA</h1>
            <p className="subtitle">
              Alex, tu Consultor Personal de Viajes{' '}
              <Luggage size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '4px' }} />
              <Plane size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '2px' }} />
            </p>
          </header>

          <main className="main-content">
            <form onSubmit={handleFormSubmit} className="survey-form">
              <h2 className="survey-title">Cuéntanos sobre tu viaje ideal</h2>
              <p className="survey-subtitle">Completa este formulario rápido para comenzar</p>

              <div className="form-group">
                <label htmlFor="destination" className="form-label">
                  ¿A dónde quieres viajar?
                </label>
                <div className="destination-input-wrapper">
                  <MapPin className="destination-icon" size={20} />
                  <input
                    type="text"
                    id="destination"
                    name="destination"
                    className={`form-input destination-input ${destinationError ? 'error' : ''}`}
                    placeholder="Escribe un país, ciudad o destino turístico"
                    value={formData.destination}
                    onChange={handleInputChange}
                    onBlur={handleDestinationBlur}
                    onFocus={async () => {
                      // Cargar destinos populares si no están cargados
                      const destinations = await loadPopularDestinations();
                      
                      // Si hay texto, buscar con Gemini y mostrar sugerencias
                      if (formData.destination.trim().length > 0) {
                        // Filtrar destinos populares primero
                        const filtered = destinations.filter(dest =>
                          dest.toLowerCase().includes(formData.destination.toLowerCase())
                        );
                        
                        if (filtered.length > 0) {
                          startTransition(() => {
                            setDestinationSuggestions(filtered.slice(0, 5));
                            setShowSuggestions(true);
                          });
                        }
                        
                        // Buscar con Gemini
                        const searchResults = await searchDestinations(formData.destination);
                        if (searchResults.length > 0) {
                          const combined = [...new Set([...filtered, ...searchResults])].slice(0, 5);
                          startTransition(() => {
                            setDestinationSuggestions(combined);
                            setShowSuggestions(true);
                          });
                        } else if (filtered.length > 0) {
                          startTransition(() => {
                            setDestinationSuggestions(filtered.slice(0, 5));
                            setShowSuggestions(true);
                          });
                        }
                      } else {
                        // Si no hay texto, mostrar los destinos populares
                        if (destinations.length > 0) {
                          startTransition(() => {
                            setDestinationSuggestions(destinations.slice(0, 5));
                            setShowSuggestions(true);
                          });
                        }
                      }
                    }}
                    autoComplete="off"
                    required
                  />
                  {showSuggestions && destinationSuggestions.length > 0 && (
                    <div className="suggestions-dropdown">
                      {destinationSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="suggestion-item"
                          onClick={() => handleDestinationSelect(suggestion)}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <Plane className="suggestion-icon" size={16} />
                          <span className="suggestion-text">{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {destinationError && (
                  <div className="error-message">{destinationError}</div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  ¿Cuándo?
                </label>
                
                <div className="date-range-container">
                  <div className="date-input-wrapper">
                    <label htmlFor="departureDate" className="date-label">
                      Ida
                    </label>
                    <div className="date-input-disabled" onClick={handleOpenDateModal}>
                      <Calendar className="calendar-icon" size={20} />
                      <input
                        type="text"
                        id="departureDate"
                        className="form-input date-input-disabled-field"
                        value={formatDateForDisplay(formData.departureDate)}
                        placeholder="Seleccionar fecha"
                        readOnly
                        required
                      />
                    </div>
                  </div>
                  <div className="date-separator">
                    <ArrowRight size={20} />
                  </div>
                  <div className={`date-input-wrapper ${tripType === 'open' ? 'disabled' : ''}`}>
                    <label htmlFor="returnDate" className="date-label">
                      Vuelta
                    </label>
                    <div className={`date-input-disabled ${tripType === 'open' ? 'disabled' : ''}`} onClick={tripType === 'open' ? undefined : handleOpenDateModal}>
                      <Calendar className="calendar-icon" size={20} />
                      <input
                        type="text"
                        id="returnDate"
                        className="form-input date-input-disabled-field"
                        value={formatDateForDisplay(formData.returnDate)}
                        placeholder="Seleccionar fecha"
                        readOnly
                        disabled={tripType === 'open'}
                        required={tripType === 'closed'}
                      />
                    </div>
                  </div>
                  <div className={`quick-duration-wrapper ${tripType === 'open' ? 'disabled' : ''}`}>
                    <label className="date-label">
                      Duración rápida
                    </label>
                    <div className="quick-duration-buttons">
                      {[3, 5, 7, 10].map(days => (
                        <button
                          key={days}
                          type="button"
                          className="quick-duration-button"
                          onClick={() => handleQuickDurationSelect(days)}
                          disabled={tripType === 'open'}
                        >
                          {days} días
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {tripType === 'closed' && formData.departureDate && formData.returnDate && calculatedDays !== null && (
                  <div className="days-info-row">
                    {calculatedDays > 30 ? (
                      <span className="long-trip-warning-inline">
                        Viaje largo: más de 30 días. Asegúrate de tener suficiente presupuesto y documentación.
                      </span>
                    ) : (
                      <span className="days-info-text">
                        {calculatedDays} {calculatedDays === 1 ? 'día' : 'días'} de viaje
                      </span>
                    )}
                  </div>
                )}

                {tripType === 'open' && formData.departureDate && (
                  <div className="days-info-row">
                    <span className="days-info-text">
                      <Unlock size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
                      Viaje abierto desde {new Date(formData.departureDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>

              {/* Modal de Calendario */}
              {showDateModal && (
                <div className="date-modal-overlay" onClick={handleCloseDateModal}>
                  <div className="date-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="date-modal-header">
                      <button 
                        type="button" 
                        className="date-modal-close"
                        onClick={handleCloseDateModal}
                      >
                        <X size={24} />
                      </button>
                    </div>
                    
                    <div className="date-modal-content">
                      {/* Inputs de fecha y selector de tipo de viaje en la misma fila */}
                      <div className="modal-top-section">
                        <div className="modal-date-inputs">
                          <div className="modal-date-input-wrapper">
                            <label className="modal-date-label">Ida</label>
                            <div className="modal-date-input">
                              <Calendar className="modal-calendar-icon" size={20} />
                              <input
                                type="text"
                                value={selectedStartDate ? formatDateForDisplay(selectedStartDate.toISOString().split('T')[0]) : ''}
                                placeholder="Seleccionar fecha"
                                readOnly
                              />
                            </div>
                          </div>
                          <div className={`modal-date-input-wrapper ${modalTripType === 'one-way' ? 'disabled' : ''}`}>
                            <label className="modal-date-label">Vuelta</label>
                            <div className="modal-date-input">
                              <Calendar className="modal-calendar-icon" size={20} />
                              <input
                                type="text"
                                value={selectedEndDate ? formatDateForDisplay(selectedEndDate.toISOString().split('T')[0]) : ''}
                                placeholder="Seleccionar fecha"
                                readOnly
                                disabled={modalTripType === 'one-way'}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Selector de tipo de viaje */}
                        <div className="modal-trip-type-selector">
                          <button
                            type="button"
                            className={`modal-trip-type-button ${modalTripType === 'round-trip' ? 'active' : ''}`}
                            onClick={() => {
                              setModalTripType('round-trip');
                              setIsSelectingStart(true);
                              if (!selectedEndDate && selectedStartDate) {
                                setSelectedEndDate(null);
                              }
                            }}
                          >
                            Ida y vuelta
                          </button>
                          <button
                            type="button"
                            className={`modal-trip-type-button ${modalTripType === 'one-way' ? 'active' : ''}`}
                            onClick={() => {
                              setModalTripType('one-way');
                              setSelectedEndDate(null);
                              setHoverDate(null);
                            }}
                          >
                            Solo ida
                          </button>
                        </div>
                      </div>

                      {/* Duración rápida en el modal */}
                      <div className={`modal-quick-duration-selector ${modalTripType === 'one-way' ? 'disabled' : ''}`}>
                        <span className="modal-quick-duration-label">Duración rápida</span>
                        <div className="modal-quick-duration-buttons">
                          {[3, 5, 7, 10].map(days => (
                            <button
                              key={days}
                              type="button"
                              className="modal-quick-duration-button"
                              onClick={() => handleModalQuickDurationSelect(days)}
                              disabled={modalTripType === 'one-way'}
                            >
                              {days} días
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="calendar-navigation">
                        <button 
                          type="button"
                          className="calendar-nav-button"
                          onClick={() => navigateMonth(-1)}
                        >
                          <ChevronLeft size={24} />
                        </button>
                        <div className="calendar-months">
                          <div className="calendar-month-header">
                            {getMonthName(calendarMonth)}
                          </div>
                          <div className="calendar-month-header">
                            {(() => {
                              const nextMonth = new Date(calendarMonth);
                              nextMonth.setMonth(nextMonth.getMonth() + 1);
                              return getMonthName(nextMonth);
                            })()}
                          </div>
                        </div>
                        <button 
                          type="button"
                          className="calendar-nav-button"
                          onClick={() => navigateMonth(1)}
                        >
                          <ChevronRight size={24} />
                        </button>
                      </div>

                      <div className="calendar-container">
                        {renderCalendar(0)}
                        {renderCalendar(1)}
                      </div>

                      <div className="date-modal-footer">
                        <button
                          type="button"
                          className="date-modal-confirm"
                          onClick={handleApplyDates}
                          disabled={!selectedStartDate || (modalTripType === 'round-trip' && !selectedEndDate)}
                        >
                          {modalTripType === 'round-trip' && selectedStartDate && selectedEndDate
                            ? `Seleccionar viaje de ${getModalDaysCount()} ${getModalDaysCount() === 1 ? 'día' : 'días'}`
                            : selectedStartDate
                            ? 'Seleccionar fecha de ida'
                            : 'Seleccionar fechas'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-group-row">
                <div className="form-group">
                  <label className="form-label">
                    ¿Cuántas personas viajan?
                  </label>
                  <div className="travelers-input-disabled" onClick={handleOpenTravelersModal}>
                    <Users className="travelers-icon" size={20} />
                    <input
                      type="text"
                      className="form-input travelers-input-disabled-field"
                      value={formatTravelersSummary()}
                      placeholder="Seleccionar viajeros"
                      readOnly
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="budget" className="form-label">
                    ¿Cuál es tu presupuesto aproximado?
                  </label>
                  <select
                    id="budget"
                    name="budget"
                    className="form-input"
                    value={formData.budget}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Selecciona un rango</option>
                    <option value="Menos de $500">Menos de $500</option>
                    <option value="$500 - $1,000">$500 - $1,000</option>
                    <option value="$1,000 - $2,500">$1,000 - $2,500</option>
                    <option value="$2,500 - $5,000">$2,500 - $5,000</option>
                    <option value="Más de $5,000">Más de $5,000</option>
                  </select>
                </div>
              </div>

              {/* Modal de Viajeros */}
              {showTravelersModal && (
                <div className="travelers-modal-overlay" onClick={handleCloseTravelersModal}>
                  <div className="travelers-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="travelers-modal-header">
                      <button 
                        type="button" 
                        className="travelers-modal-close"
                        onClick={handleCloseTravelersModal}
                      >
                        <X size={24} />
                      </button>
                    </div>
                    
                    <div className="travelers-modal-content">
                      <h3 className="travelers-modal-title">Seleccionar viajeros</h3>
                      
                      <div className="traveler-stepper">
                        <div className="traveler-label">
                          <User className="traveler-icon" size={20} />
                          <span className="traveler-text">Adultos</span>
                        </div>
                        <div className="stepper-controls">
                          <button
                            type="button"
                            className="stepper-button"
                            onClick={() => handleTravelerChange('adults', -1)}
                            disabled={formData.adults <= 1}
                          >
                            <Minus size={18} />
                          </button>
                          <span className="stepper-value">{formData.adults}</span>
                          <button
                            type="button"
                            className="stepper-button"
                            onClick={() => handleTravelerChange('adults', 1)}
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                      </div>

                      <div className="traveler-stepper">
                        <div className="traveler-label">
                          <User className="traveler-icon" size={18} />
                          <span className="traveler-text">Niños</span>
                        </div>
                        <div className="stepper-controls">
                          <button
                            type="button"
                            className="stepper-button"
                            onClick={() => handleTravelerChange('children', -1)}
                            disabled={formData.children <= 0}
                          >
                            <Minus size={18} />
                          </button>
                          <span className="stepper-value">{formData.children}</span>
                          <button
                            type="button"
                            className="stepper-button"
                            onClick={() => handleTravelerChange('children', 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="traveler-stepper">
                        <div className="traveler-label">
                          <Baby className="traveler-icon" size={20} />
                          <span className="traveler-text">Bebés</span>
                        </div>
                        <div className="stepper-controls">
                          <button
                            type="button"
                            className="stepper-button"
                            onClick={() => handleTravelerChange('infants', -1)}
                            disabled={formData.infants <= 0}
                          >
                            <Minus size={18} />
                          </button>
                          <span className="stepper-value">{formData.infants}</span>
                          <button
                            type="button"
                            className="stepper-button"
                            onClick={() => handleTravelerChange('infants', 1)}
                            disabled={formData.adults === 0}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="travelers-modal-footer">
                        <button
                          type="button"
                          className="travelers-modal-confirm"
                          onClick={handleCloseTravelersModal}
                          disabled={getTotalTravelers() === 0}
                        >
                          {getTotalTravelers() > 0
                            ? `Seleccionar ${getTotalTravelers()} ${getTotalTravelers() === 1 ? 'persona' : 'personas'}`
                            : 'Seleccionar viajeros'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">
                  ¿Prefieres aventura, relajación o cultura?
                </label>
                <div className="preference-buttons">
                  <button
                    type="button"
                    className={`preference-button ${formData.preference === 'aventura' ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, preference: 'aventura' }))}
                  >
                    <Mountain size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Aventura
                  </button>
                  <button
                    type="button"
                    className={`preference-button ${formData.preference === 'relajación' ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, preference: 'relajación' }))}
                  >
                    <Umbrella size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Relajación
                  </button>
                  <button
                    type="button"
                    className={`preference-button ${formData.preference === 'cultura' ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, preference: 'cultura' }))}
                  >
                    <Landmark size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Cultura
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className="submit-button"
                disabled={
                  !formData.destination || 
                  !formData.departureDate || 
                  (tripType === 'closed' && !formData.returnDate) || 
                  formData.adults < 1 ||
                  !formData.budget || 
                  !formData.preference
                }
              >
                Continuar <ArrowRight size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '4px' }} />
              </button>
            </form>
          </main>
        </div>
      </div>
    );
  }


  return (
    <>
    <div className="App">
      <div className="chat-layout">
        {/* Header fijo */}
        <header className="chat-header">
          <div className="chat-header-content">
            <div className="chat-header-left">
              <div className="chat-header-title-section">
                <h1 className="chat-title">ViajeIA</h1>
                <p className="chat-subtitle">
                  Alex, tu Consultor Personal de Viajes
                </p>
              </div>
              {/* Información del clima debajo del nombre en pantallas pequeñas */}
              <div className="header-weather-info-mobile">
                {/* Información del clima en el header - widget completo si hay weatherInfo */}
                {weatherInfo && (
                  <div className="header-weather-info">
                    <div className="weather-header-container">
                      <div className="weather-header-left">
                        <Cloud className="weather-main-icon" />
                        <div className="weather-header-left-content">
                          <div className="weather-label">Clima Actual en</div>
                          <div className="weather-city" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {weatherInfo.city}
                            {formData.destination && (
                              <button
                                type="button"
                                className="favorite-toggle-button"
                                onClick={saveCurrentAsFavorite}
                                title={isFavorite(formData.destination) ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '2px',
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'color 0.2s ease',
                                  color: isFavorite(formData.destination) ? '#ef4444' : 'rgba(255, 255, 255, 0.7)',
                                  lineHeight: 1
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = isFavorite(formData.destination) ? '#dc2626' : '#ffffff';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = isFavorite(formData.destination) ? '#ef4444' : 'rgba(255, 255, 255, 0.7)';
                                }}
                              >
                                {isFavorite(formData.destination) ? (
                                  <Heart size={16} fill="currentColor" />
                                ) : (
                                  <Heart size={16} />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="weather-header-divider"></div>
                      <div className="weather-header-right">
                        {weatherInfo.temperatura && (
                          <div className="weather-detail-item">
                            <Thermometer size={14} className="weather-detail-icon" />
                            <span>{weatherInfo.temperatura}</span>
                          </div>
                        )}
                        {weatherInfo.condiciones && (
                          <div className="weather-detail-item">
                            <Cloud size={14} className="weather-detail-icon" />
                            <span>{weatherInfo.condiciones}</span>
                          </div>
                        )}
                        {(weatherInfo.humedad || weatherInfo.viento) && (
                          <div className="weather-detail-row">
                            {weatherInfo.humedad && (
                              <div className="weather-detail-item">
                                <Droplets size={14} className="weather-detail-icon" />
                                <span>{weatherInfo.humedad}</span>
                              </div>
                            )}
                            {weatherInfo.viento && (
                              <div className="weather-detail-item">
                                <Wind size={14} className="weather-detail-icon" />
                                <span>{weatherInfo.viento}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Solo nombre y corazón si hay destino pero no hay información del clima - no mostrar mientras se carga */}
                {!weatherInfo && formData.destination && !loading && (
                  <div className="header-destination-simple">
                    <span className="destination-name">{formData.destination}</span>
                    <button
                      type="button"
                      className="favorite-toggle-button"
                      onClick={saveCurrentAsFavorite}
                      title={isFavorite(formData.destination) ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.2s ease',
                        color: isFavorite(formData.destination) ? '#ef4444' : 'rgba(255, 255, 255, 0.7)',
                        lineHeight: 1,
                        marginLeft: '8px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = isFavorite(formData.destination) ? '#dc2626' : '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = isFavorite(formData.destination) ? '#ef4444' : 'rgba(255, 255, 255, 0.7)';
                      }}
                    >
                      {isFavorite(formData.destination) ? (
                        <Heart size={16} fill="currentColor" />
                      ) : (
                        <Heart size={16} />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="chat-header-center">
              {/* Información del clima en el header - widget completo si hay weatherInfo (solo en pantallas grandes) */}
              {weatherInfo && (
                <div className="header-weather-info header-weather-info-desktop">
                  <div className="weather-header-container">
                    <div className="weather-header-left">
                      <Cloud className="weather-main-icon" />
                      <div className="weather-header-left-content">
                        <div className="weather-label">Clima Actual en</div>
                        <div className="weather-city" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {weatherInfo.city}
                          {formData.destination && (
                            <button
                              type="button"
                              className="favorite-toggle-button"
                              onClick={saveCurrentAsFavorite}
                              title={isFavorite(formData.destination) ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '2px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'color 0.2s ease',
                                color: isFavorite(formData.destination) ? '#ef4444' : 'rgba(255, 255, 255, 0.7)',
                                lineHeight: 1
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = isFavorite(formData.destination) ? '#dc2626' : '#ffffff';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = isFavorite(formData.destination) ? '#ef4444' : 'rgba(255, 255, 255, 0.7)';
                              }}
                            >
                              {isFavorite(formData.destination) ? (
                                <Heart size={16} fill="currentColor" />
                              ) : (
                                <Heart size={16} />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="weather-header-divider"></div>
                    <div className="weather-header-right">
                      {weatherInfo.temperatura && (
                        <div className="weather-detail-item">
                          <Thermometer size={14} className="weather-detail-icon" />
                          <span>{weatherInfo.temperatura}</span>
                        </div>
                      )}
                      {weatherInfo.condiciones && (
                        <div className="weather-detail-item">
                          <Cloud size={14} className="weather-detail-icon" />
                          <span>{weatherInfo.condiciones}</span>
                        </div>
                      )}
                      {(weatherInfo.humedad || weatherInfo.viento) && (
                        <div className="weather-detail-row">
                          {weatherInfo.humedad && (
                            <div className="weather-detail-item">
                              <Droplets size={14} className="weather-detail-icon" />
                              <span>{weatherInfo.humedad}</span>
                            </div>
                          )}
                          {weatherInfo.viento && (
                            <div className="weather-detail-item">
                              <Wind size={14} className="weather-detail-icon" />
                              <span>{weatherInfo.viento}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Solo nombre y corazón si hay destino pero no hay información del clima - no mostrar mientras se carga (solo en pantallas grandes) */}
              {!weatherInfo && formData.destination && !loading && (
                <div className="header-destination-simple header-destination-simple-desktop">
                  <span className="destination-name">{formData.destination}</span>
                  <button
                    type="button"
                    className="favorite-toggle-button"
                    onClick={saveCurrentAsFavorite}
                    title={isFavorite(formData.destination) ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'color 0.2s ease',
                      color: isFavorite(formData.destination) ? '#ef4444' : 'rgba(255, 255, 255, 0.7)',
                      lineHeight: 1,
                      marginLeft: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = isFavorite(formData.destination) ? '#dc2626' : '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = isFavorite(formData.destination) ? '#ef4444' : 'rgba(255, 255, 255, 0.7)';
                    }}
                  >
                    {isFavorite(formData.destination) ? (
                      <Heart size={16} fill="currentColor" />
                    ) : (
                      <Heart size={16} />
                    )}
                  </button>
                </div>
              )}
            </div>
            <div className="chat-header-right">
              <button
                type="button"
                className={`side-panel-toggle ${showSidePanel ? 'active' : ''}`}
                onClick={() => setShowSidePanel(!showSidePanel)}
                aria-label="Toggle panel lateral"
              >
                <ChevronRight size={20} className={showSidePanel ? 'rotated' : ''} />
              </button>
            </div>
          </div>
        </header>

        {/* Fotos fijas - debajo del header, encima del área de chat */}
        {photos && photos.length > 0 && (
          <div className="fixed-photos-section">
            <div className="result-photos-grid">
              {photos.slice(0, 3).map((photo, index) => (
                <div key={photo.id || index} className="result-photo-item">
                  <img
                    src={photo.url || photo.url_small}
                    alt={photo.description || `Foto del destino`}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contenedor principal con panel lateral */}
        <div className="chat-main-container">
          {/* Panel lateral colapsable */}
          <aside className={`side-panel ${showSidePanel ? 'open' : ''}`}>
            <div className="side-panel-content">
              <div className="side-panel-section">
                <h3 className="side-panel-title">Acciones Rápidas</h3>
                <div className="quick-actions">
                  <button
                    type="button"
                    className="quick-action-btn"
                    onClick={() => setShowForm(true)}
                    disabled={showForm}
                  >
                    <ArrowLeft size={18} />
                    <span>Modificar Viaje</span>
                  </button>
                  <button
                    type="button"
                    className="quick-action-btn"
                    onClick={() => {
                      setShowHistory(!showHistory);
                      if (!showHistory && sessionId) {
                        loadConversationHistory();
                      }
                    }}
                    disabled={!sessionId || !formData.destination}
                  >
                    <History size={18} />
                    <span>Historial</span>
                  </button>
                  <button
                    type="button"
                    className="quick-action-btn"
                    onClick={handleDownloadItinerary}
                    disabled={!sessionId || !response}
                  >
                    <Download size={18} />
                    <span>Descargar PDF</span>
                  </button>
                  <button
                    type="button"
                    className="quick-action-btn"
                    onClick={() => {
                      setShowFavorites(!showFavorites);
                      if (!showFavorites) {
                        loadFavorites();
                      }
                    }}
                  >
                    <Bookmark size={18} />
                    <span>Favoritos</span>
                  </button>
                </div>
              </div>
              
              {realtimeInfo && (
                <div className="side-panel-section">
                  <h3 className="side-panel-title">Info en Tiempo Real</h3>
                  <div className="realtime-info-compact">
                    {/* Temperatura */}
                    {realtimeInfo.temperature !== null && realtimeInfo.temperature !== undefined && (
                      <div className="realtime-info-compact-item">
                        <span className="realtime-info-compact-label">Temperatura</span>
                        <span className="realtime-info-compact-value">{realtimeInfo.temperature}°C</span>
                      </div>
                    )}
                    
                    {/* Tipo de cambio */}
                    {realtimeInfo.exchange_rate && typeof realtimeInfo.exchange_rate === 'object' && (
                      <div className="realtime-info-compact-item">
                        <span className="realtime-info-compact-label">Tipo de Cambio</span>
                        <span className="realtime-info-compact-value">
                          {realtimeInfo.exchange_rate.currency_code && (
                            <>1 USD = {realtimeInfo.exchange_rate.usd_to_dest} {realtimeInfo.exchange_rate.currency_code}</>
                          )}
                        </span>
                      </div>
                    )}
                    
                    {/* Diferencia horaria */}
                    {realtimeInfo.time_difference && typeof realtimeInfo.time_difference === 'object' && (
                      <div className="realtime-info-compact-item">
                        <span className="realtime-info-compact-label">Diferencia Horaria</span>
                        <span className="realtime-info-compact-value">
                          {realtimeInfo.time_difference.difference_string || `${realtimeInfo.time_difference.difference_hours}h`}
                        </span>
                      </div>
                    )}
                    
                    {/* Clima */}
                    {realtimeInfo.weather && typeof realtimeInfo.weather === 'object' && (
                      <div className="realtime-info-compact-item">
                        <span className="realtime-info-compact-label">Clima</span>
                        <span className="realtime-info-compact-value">
                          {realtimeInfo.weather.temperatura || realtimeInfo.weather.descripcion || 'N/A'}
                        </span>
                      </div>
                    )}
                    
                    {/* Otros valores simples */}
                    {Object.entries(realtimeInfo).map(([key, value]) => {
                      // Saltar objetos complejos que ya renderizamos arriba
                      if (key === 'exchange_rate' || key === 'time_difference' || key === 'weather' || key === 'temperature') {
                        return null;
                      }
                      // Solo renderizar valores primitivos
                      if (typeof value === 'object' && value !== null) {
                        return null;
                      }
                      return (
                        <div key={key} className="realtime-info-compact-item">
                          <span className="realtime-info-compact-label">{key}</span>
                          <span className="realtime-info-compact-value">{String(value)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Área de chat principal */}
          <main className="chat-main">
            <div className="chat-messages" ref={chatContainerRef}>
              {/* Mensaje de bienvenida inicial - solo si no hay mensajes en el chat y no se está cargando */}
              {chatMessages.length === 0 && !loading && (
                <div className="message message-assistant welcome-message">
                  <div className="message-avatar">
                    <Luggage size={24} />
                  </div>
                  <div className="message-content">
                    <div className="message-text">
                      <p>¡Hola! Soy Alex, tu Consultor Personal de Viajes. 👋</p>
                      <p>Puedo ayudarte a planificar tu próximo viaje. Solo dime:</p>
                      <ul>
                        <li>¿A dónde quieres viajar?</li>
                        <li>¿Cuál es tu presupuesto?</li>
                        <li>¿Qué tipo de actividades te interesan?</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Historial de conversación - mensajes en orden secuencial */}
              {chatMessages.map((msg, msgIndex) => {
                if (msg.role === 'user') {
                  return (
                    <div key={`user-${msgIndex}`} className="message message-user">
                      <div className="message-content">
                        <div className="message-text">{msg.content}</div>
                      </div>
                      <div className="message-avatar">
                        <User size={20} />
                      </div>
                    </div>
                  );
                } else if (msg.role === 'assistant') {
                  // Usar la respuesta actual si es la última y está cargando, sino usar el contenido guardado
                  const isLastResponse = msgIndex === chatMessages.length - 1 && !loading;
                  const responseToParse = isLastResponse && response ? response : msg.content;
                  const parsed = parseResponseSections(responseToParse);
                  
                  return (() => {
                    if (parsed && parsed.sections && Object.keys(parsed.sections).length > 0) {
                      const sectionKeys = Object.keys(parsed.sections);
                      const resultId = `result-${msgIndex}`;
                      // Obtener el índice del carrusel para este mensaje específico
                      const messageCarouselIndex = carouselIndices[resultId] || 0;
                      const validIndex = Math.min(messageCarouselIndex, sectionKeys.length - 1);
                      const currentSectionKey = sectionKeys[validIndex];
                      const currentSectionContent = parsed.sections[currentSectionKey];
                      const hasMultipleSections = sectionKeys.length > 1;
                      // Por defecto, los resultados están expandidos (undefined !== false = true)
                      // Si está explícitamente en false, entonces está colapsado
                      const isExpanded = expandedResults[resultId] !== false;
                      
                      // Crear o obtener el ref para el scroll de este mensaje
                      if (!sectionScrollRefs.current[resultId]) {
                        sectionScrollRefs.current[resultId] = React.createRef();
                      }
                      const sectionScrollRef = sectionScrollRefs.current[resultId];

                      return (
                        <div key={`assistant-${msgIndex}`} className="message message-assistant">
                          <div className="message-avatar">
                            <Luggage size={24} />
                          </div>
                          <div className="message-content">
                            <div className="result-card">
                              {/* El encabezado del clima ahora está fijo fuera del área de chat */}
                              
                              {/* Las fotos ahora están en el encabezado fijo fuera del área de chat */}

                              {/* Contenido expandible - solo para respuestas con secciones */}
                              <div className={`result-content result-content-with-sections ${isExpanded ? 'expanded' : ''}`}>
                                {/* Texto antes de las secciones */}
                                {parsed.beforeText && parsed.beforeText.trim().length > 0 && (
                                  <div className="result-text">
                                    {renderPlainText(parsed.beforeText)}
                                  </div>
                                )}

                                {/* Carrusel de secciones */}
                                <div className="result-sections">
                                  <div className="section-card">
                                    <div className="section-header">
                                      <div className="section-title">
                                        {getSectionIcon(currentSectionKey)}
                                        <span>{currentSectionKey}</span>
                                      </div>
                                      {hasMultipleSections && (
                                        <div className="section-nav">
                                          <button
                                            className="section-nav-btn"
                                            onClick={() => navigateCarousel('prev', resultId, responseToParse)}
                                            aria-label="Sección anterior"
                                          >
                                            <ChevronLeft size={18} />
                                          </button>
                                          <span className="section-indicator">
                                            {validIndex + 1} / {sectionKeys.length}
                                          </span>
                                          <button
                                            className="section-nav-btn"
                                            onClick={() => navigateCarousel('next', resultId, responseToParse)}
                                            aria-label="Siguiente sección"
                                          >
                                            <ChevronRight size={18} />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                    <div className="section-content" ref={sectionScrollRef}>
                                      {renderSectionContent(currentSectionContent, currentSectionKey)}
                                    </div>
                                  </div>
                                </div>

                                {/* Texto después de las secciones */}
                                {parsed.afterText && parsed.afterText.trim().length > 0 && (
                                  <div className="result-text">
                                    {renderPlainText(parsed.afterText)}
                                  </div>
                                )}
                              </div>

                              {/* Botón para expandir/colapsar */}
                              <button
                                type="button"
                                className="expand-btn"
                                onClick={() => toggleExpandResult(resultId)}
                              >
                                {isExpanded ? 'Ver menos' : 'Ver más'}
                                <ChevronRight size={16} className={isExpanded ? 'rotated' : ''} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      // Respuesta simple sin secciones - sin result-card para evitar doble marco
                      return (
                        <div key={`assistant-${msgIndex}`} className="message message-assistant">
                          <div className="message-avatar">
                            <Luggage size={24} />
                          </div>
                          <div className="message-content">
                            <div className="message-text">
                              {renderPlainText(msg.content)}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })();
                }
                return null;
              })}

              {/* Skeleton loader mientras se carga la respuesta - se muestra cuando está cargando y hay un mensaje del usuario esperando respuesta */}
              {loading && chatMessages.length > 0 && chatMessages[chatMessages.length - 1].role === 'user' && (
                <div className="message message-assistant">
                  <div className="message-avatar">
                    <Luggage size={24} />
                  </div>
                  <div className="message-content">
                    <div className="skeleton-message">
                      {/* Primer párrafo */}
                      <div className="skeleton-paragraph">
                        <div className="skeleton skeleton-line" style={{ width: '100%' }}></div>
                        <div className="skeleton skeleton-line" style={{ width: '100%' }}></div>
                        <div className="skeleton skeleton-line" style={{ width: '85%' }}></div>
                      </div>
                      {/* Segundo párrafo */}
                      <div className="skeleton-paragraph">
                        <div className="skeleton skeleton-line" style={{ width: '100%' }}></div>
                        <div className="skeleton skeleton-line" style={{ width: '90%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mostrar la última respuesta si está cargando o si no hay mensajes en chatMessages pero sí hay response */}
              {!loading && response && response.trim().length > 0 && chatMessages.length === 0 && (() => {
                const parsed = parsedResponse;
                
                if (parsed && parsed.sections && Object.keys(parsed.sections).length > 0) {
                  const sectionKeys = Object.keys(parsed.sections);
                  const resultId = `result-${Date.now()}`;
                  // Obtener el índice del carrusel para este mensaje específico
                  const messageCarouselIndex = carouselIndices[resultId] || 0;
                  const validIndex = Math.min(messageCarouselIndex, sectionKeys.length - 1);
                  const currentSectionKey = sectionKeys[validIndex];
                  const currentSectionContent = parsed.sections[currentSectionKey];
                  const hasMultipleSections = sectionKeys.length > 1;
                  // Por defecto, los resultados están expandidos (undefined !== false = true)
                  // Si está explícitamente en false, entonces está colapsado
                  const isExpanded = expandedResults[resultId] !== false;
                  
                  // Crear o obtener el ref para el scroll de este mensaje
                  if (!sectionScrollRefs.current[resultId]) {
                    sectionScrollRefs.current[resultId] = { current: null };
                  }
                  const sectionScrollRef = sectionScrollRefs.current[resultId];

                  return (
                    <div className="message message-assistant">
                      <div className="message-avatar">
                        <Luggage size={24} />
                      </div>
                      <div className="message-content">
                        <div className="result-card">
                          {/* El encabezado del clima ahora está fijo fuera del área de chat */}

                          {/* Las fotos ahora están en el encabezado fijo fuera del área de chat */}

                          {/* Contenido expandible - solo para respuestas con secciones */}
                          <div className={`result-content result-content-with-sections ${isExpanded ? 'expanded' : ''}`}>
                            {/* Texto antes de las secciones */}
                            {parsed.beforeText && parsed.beforeText.trim().length > 0 && (
                              <div className="result-text">
                                {renderPlainText(parsed.beforeText)}
                              </div>
                            )}

                            {/* Carrusel de secciones */}
                            <div className="result-sections">
                              <div className="section-card">
                                <div className="section-header">
                                  <div className="section-title">
                                    {getSectionIcon(currentSectionKey)}
                                    <span>{currentSectionKey}</span>
                                  </div>
                                  {hasMultipleSections && (
                                    <div className="section-nav">
                                      <button
                                        className="section-nav-btn"
                                        onClick={() => navigateCarousel('prev', resultId, response)}
                                        aria-label="Sección anterior"
                                      >
                                        <ChevronLeft size={18} />
                                      </button>
                                      <span className="section-indicator">
                                        {validIndex + 1} / {sectionKeys.length}
                                      </span>
                                      <button
                                        className="section-nav-btn"
                                        onClick={() => navigateCarousel('next', resultId, response)}
                                        aria-label="Siguiente sección"
                                      >
                                        <ChevronRight size={18} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <div className="section-content" ref={sectionScrollRef}>
                                  {renderSectionContent(currentSectionContent, currentSectionKey)}
                                </div>
                              </div>
                            </div>

                            {/* Texto después de las secciones */}
                            {parsed.afterText && parsed.afterText.trim().length > 0 && (
                              <div className="result-text">
                                {renderPlainText(parsed.afterText)}
                              </div>
                            )}
                          </div>

                          {/* Botón para expandir/colapsar */}
                          <button
                            type="button"
                            className="expand-btn"
                            onClick={() => toggleExpandResult(resultId)}
                          >
                            {isExpanded ? 'Ver menos' : 'Ver más'}
                            <ChevronRight size={16} className={isExpanded ? 'rotated' : ''} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  // Respuesta simple sin secciones
                  return (
                    <div className="message message-assistant">
                      <div className="message-avatar">
                        <Luggage size={24} />
                      </div>
                      <div className="message-content">
                        <div className="result-card">
                          {/* Header completo con clima y favorito */}
                          {weatherInfo && (
                            <div className="result-card-header-weather">
                              <div className="weather-header-container">
                                <div className="weather-header-left">
                                  <Cloud className="weather-main-icon" />
                                  <div className="weather-header-left-content">
                                    <div className="weather-label">Clima Actual en</div>
                                    <div className="weather-city" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      {weatherInfo.city}
                                      {formData.destination && response && (
                                        <button
                                          type="button"
                                          className="favorite-toggle-button"
                                          onClick={saveCurrentAsFavorite}
                                          title={isFavorite(formData.destination) ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                                          style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '2px',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'color 0.2s ease',
                                            color: isFavorite(formData.destination) ? '#ef4444' : 'rgba(255, 255, 255, 0.7)',
                                            lineHeight: 1
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.color = isFavorite(formData.destination) ? '#dc2626' : '#ffffff';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.color = isFavorite(formData.destination) ? '#ef4444' : 'rgba(255, 255, 255, 0.7)';
                                          }}
                                        >
                                          {isFavorite(formData.destination) ? (
                                            <Heart size={16} fill="currentColor" />
                                          ) : (
                                            <Heart size={16} />
                                          )}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="weather-header-divider"></div>
                                <div className="weather-header-right">
                                  {weatherInfo.temperatura && (
                                    <div className="weather-detail-item">
                                      <Thermometer size={14} className="weather-detail-icon" />
                                      <span>{weatherInfo.temperatura}</span>
                                    </div>
                                  )}
                                  {weatherInfo.condiciones && (
                                    <div className="weather-detail-item">
                                      <Cloud size={14} className="weather-detail-icon" />
                                      <span>{weatherInfo.condiciones}</span>
                                    </div>
                                  )}
                                  {(weatherInfo.humedad || weatherInfo.viento) && (
                                    <div className="weather-detail-row">
                                      {weatherInfo.humedad && (
                                        <div className="weather-detail-item">
                                          <Droplets size={14} className="weather-detail-icon" />
                                          <span>{weatherInfo.humedad}</span>
                                        </div>
                                      )}
                                      {weatherInfo.viento && (
                                        <div className="weather-detail-item">
                                          <Wind size={14} className="weather-detail-icon" />
                                          <span>{weatherInfo.viento}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Las fotos ahora están en el encabezado fijo fuera del área de chat */}
                          
                          <div className="result-content">
                            <div className="message-text">
                              {renderPlainText(response)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              })()}

              {/* Referencia para scroll automático */}
              <div ref={messagesEndRef} />
            </div>

            {/* Input fijo en la parte inferior */}
            <div className="chat-input-container">
              <form onSubmit={handleSubmit} className="chat-input-form">
                <div className="chat-input-wrapper">
                  <textarea
                    className="chat-input"
                    placeholder="Escribe tu pregunta aquí... (Enter para enviar, Shift+Enter para nueva línea)"
                    value={question}
                    onChange={(e) => {
                      // NO limpiar la respuesta cuando el usuario escribe
                      // La información debe permanecer visible
                      setQuestion(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (question.trim() && !loading) {
                          handleSubmit(e);
                        }
                      }
                    }}
                    rows="1"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    className="chat-send-btn"
                    disabled={loading || !question.trim()}
                    aria-label="Enviar mensaje"
                  >
                    {loading ? (
                      <div className="spinner"></div>
                    ) : (
                      <ArrowRight size={20} />
                    )}
                  </button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>

      {/* Contenedor de botones flotantes en la parte inferior derecha - siempre visible */}
        <div className="floating-buttons-container">
          {/* Botón para modificar viaje */}
          <div className="floating-button-wrapper">
            <button
              type="button"
              className="floating-button modify-trip-float-button"
              onClick={() => setShowForm(true)}
              disabled={showForm || !formData.destination || formData.destination.trim() === '' || loading}
              aria-label="Modificar información del viaje"
            >
              <ArrowLeft size={24} className="floating-button-icon" />
              <span className="floating-button-glow"></span>
            </button>
            <div className="floating-tooltip">
              {showForm || !formData.destination || formData.destination.trim() === '' 
                ? 'Completa el formulario para habilitar' 
                : 'Modificar viaje'}
            </div>
          </div>

          {/* Botón de historial */}
          <div className="floating-button-wrapper">
            {conversationHistory.length > 0 && !(!sessionId || !formData.destination || formData.destination.trim() === '') && (
              <span 
                className="floating-button-badge-top"
                onClick={() => {
                  if (sessionId && formData.destination && formData.destination.trim() !== '') {
                    setShowHistory(!showHistory);
                    if (!showHistory && sessionId) {
                      loadConversationHistory();
                    }
                  }
                }}
                style={{ cursor: (!sessionId || !formData.destination || formData.destination.trim() === '') ? 'not-allowed' : 'pointer' }}
                title="Ver historial de conversaciones"
              >
                {conversationHistory.length > 10 ? '+10' : conversationHistory.length}
              </span>
            )}
            <button
              type="button"
              className="floating-button history-float-button"
              onClick={() => {
                if (sessionId && formData.destination && formData.destination.trim() !== '' && !loading) {
                  setShowHistory(!showHistory);
                  if (!showHistory && sessionId) {
                    loadConversationHistory();
                  }
                }
              }}
              disabled={!sessionId || !formData.destination || formData.destination.trim() === '' || loading}
              aria-label="Ver historial de conversaciones"
            >
              <History size={24} className="floating-button-icon" />
              <span className="floating-button-glow"></span>
            </button>
            <div className="floating-tooltip">
              Historial de conversaciones
              {!sessionId || !formData.destination || formData.destination.trim() === '' ? (
                <span className="tooltip-badge">No disponible</span>
              ) : conversationHistory.length > 0 && (
                <span className="tooltip-badge">
                  {conversationHistory.length} {conversationHistory.length === 1 ? 'mensaje' : 'mensajes'}
                </span>
              )}
            </div>
          </div>

          {/* Botón de descargar itinerario */}
          <div className="floating-button-wrapper">
            <button
              type="button"
              className="floating-button download-itinerary-float-button"
              onClick={handleDownloadItinerary}
              disabled={!sessionId || !formData.destination || formData.destination.trim() === '' || !response || response.trim() === '' || loading}
              aria-label="Descargar itinerario en PDF"
            >
              <Download size={24} className="floating-button-icon" />
              <span className="floating-button-glow"></span>
            </button>
            <div className="floating-tooltip">
              Descargar itinerario
              {!sessionId || !formData.destination || formData.destination.trim() === '' || !response || response.trim() === '' ? (
                <span className="tooltip-badge">No disponible</span>
              ) : null}
            </div>
          </div>

          {/* Botón de favoritos */}
          <div className="floating-button-wrapper">
            {favorites.length > 0 && (
              <span 
                className="floating-button-badge-top"
                onClick={() => {
                  setShowFavorites(!showFavorites);
                  if (!showFavorites) {
                    loadFavorites();
                  }
                }}
                style={{ cursor: 'pointer' }}
                title="Ver mis viajes guardados"
              >
                {favorites.length > 10 ? '+10' : favorites.length}
              </span>
            )}
            <button
              type="button"
              className="floating-button favorites-float-button"
              onClick={() => {
                if (!loading) {
                  setShowFavorites(!showFavorites);
                  if (!showFavorites) {
                    loadFavorites();
                  }
                }
              }}
              disabled={loading}
              aria-label="Mis Viajes Guardados"
            >
              <Bookmark size={24} className="floating-button-icon" />
              <span className="floating-button-glow"></span>
            </button>
            <div className="floating-tooltip">
              Mis Viajes Guardados
              {favorites.length > 0 && (
                <span className="tooltip-badge">
                  {favorites.length} {favorites.length === 1 ? 'viaje' : 'viajes'}
                </span>
              )}
            </div>
          </div>

          {/* Botón flotante para información en tiempo real */}
          {realtimeInfo && (
            <div 
              className="floating-button-wrapper realtime-button-wrapper"
              onMouseLeave={(e) => {
                // Si el mouse sale del wrapper y no va al panel, ocultar
                if (!e.relatedTarget || !(e.relatedTarget instanceof Element) || !e.relatedTarget.closest('.realtime-info-panel-float')) {
                  setShowRealtimePanel(false);
                }
              }}
            >
              <button
                type="button"
                className="floating-button realtime-info-float-button"
                onClick={() => setShowRealtimePanel(!showRealtimePanel)}
                onMouseEnter={() => setShowRealtimePanel(true)}
                aria-label="Ver información en tiempo real"
              >
                <Radio size={24} className="realtime-live-icon" />
                <span className="realtime-pulse"></span>
                <span className="floating-button-glow"></span>
              </button>
            </div>
          )}
        </div>

        {/* Panel flotante de información en tiempo real (fuera del contenedor de botones) */}
        {realtimeInfo && showRealtimePanel && (
          <div className="realtime-info-wrapper">
            <div 
              className="realtime-info-panel-float"
              onMouseEnter={() => setShowRealtimePanel(true)}
              onMouseLeave={(e) => {
                // Si el mouse sale del panel y no va al botón, ocultar
                if (!e.relatedTarget || !(e.relatedTarget instanceof Element) || !e.relatedTarget.closest('.realtime-button-wrapper')) {
                  setShowRealtimePanel(false);
                }
              }}
            >
              <div className="realtime-info-header">
                <h3 className="realtime-info-title">Información en Tiempo Real</h3>
                <button
                  type="button"
                  className="realtime-info-close"
                  onClick={() => setShowRealtimePanel(false)}
                  aria-label="Cerrar panel"
                >
                  <X size={18} />
                </button>
              </div>
          
              <div className="realtime-info-content">
                {/* Temperatura */}
                {realtimeInfo.temperature !== null && realtimeInfo.temperature !== undefined && (
                  <div className="realtime-info-item">
                    <div className="realtime-info-item-header">
                      <Thermometer size={20} className="realtime-info-icon" />
                      <span className="realtime-info-label">Temperatura Actual</span>
                    </div>
                    <div className="realtime-info-value">
                      {realtimeInfo.temperature}°C
                    </div>
                  </div>
                )}
                
                {/* Tipo de cambio */}
                {realtimeInfo.exchange_rate && (
                  <div className="realtime-info-item">
                    <div className="realtime-info-item-header">
                      <DollarSign size={20} className="realtime-info-icon" />
                      <span className="realtime-info-label">Tipo de Cambio</span>
                    </div>
                    <div className="realtime-info-value">
                      {realtimeInfo.exchange_rate.currency_code && (
                        <>
                          <div className="exchange-rate-main">
                            1 USD = {realtimeInfo.exchange_rate.usd_to_dest} {realtimeInfo.exchange_rate.currency_code}
                          </div>
                          {realtimeInfo.exchange_rate.dest_to_usd && (
                            <div className="exchange-rate-secondary">
                              1 {realtimeInfo.exchange_rate.currency_code} = {realtimeInfo.exchange_rate.dest_to_usd} USD
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Diferencia horaria */}
                {realtimeInfo.time_difference && (
                  <div className="realtime-info-item">
                    <div className="realtime-info-item-header">
                      <Clock size={20} className="realtime-info-icon" />
                      <span className="realtime-info-label">Diferencia Horaria</span>
                    </div>
                    <div className="realtime-info-value">
                      <div className="time-difference-main">
                        {realtimeInfo.time_difference.difference_string}
                      </div>
                      {realtimeInfo.time_difference.destination_time && (
                        <div className="time-difference-secondary">
                          Hora local: {realtimeInfo.time_difference.destination_time}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Mensaje si no hay información disponible */}
                {!realtimeInfo.temperature && !realtimeInfo.exchange_rate && !realtimeInfo.time_difference && (
                  <div className="realtime-info-empty">
                    <AlertCircle size={20} />
                    <p>No hay información disponible para este destino</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Panel de historial de conversaciones */}
        {showHistory && (
          <div className="history-panel-overlay" onClick={() => setShowHistory(false)}>
            <div className="history-panel" onClick={(e) => e.stopPropagation()}>
              <div className="history-panel-header">
                <h3 className="history-panel-title">
                  <History size={20} />
                  Historial de Conversaciones
                </h3>
                <button
                  type="button"
                  className="history-panel-close"
                  onClick={() => setShowHistory(false)}
                  aria-label="Cerrar historial"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="history-panel-content">
                {conversationHistory.length === 0 ? (
                  <div className="history-empty">
                    <MessageSquare size={48} />
                    <p>No hay conversaciones anteriores</p>
                    <p className="history-empty-subtitle">Las preguntas y respuestas aparecerán aquí</p>
                  </div>
                ) : (
                  <div className="history-messages">
                    {conversationHistory.map((msg, index) => {
                      // Parsear respuesta del asistente si es JSON
                      let displayContent = msg.content;
                      if (msg.role === 'assistant') {
                        const parsed = parseResponseSections(msg.content);
                        if (parsed && parsed.sections) {
                          // Formatear las secciones de forma legible
                          const sections = Object.entries(parsed.sections).map(([name, content]) => {
                            const lines = content.split('\n').filter(line => line.trim());
                            return `**${name}:**\n${lines.map(line => `• ${line}`).join('\n')}`;
                          }).join('\n\n');
                          
                          displayContent = sections;
                          if (parsed.beforeText) {
                            displayContent = parsed.beforeText + '\n\n' + displayContent;
                          }
                          if (parsed.afterText) {
                            displayContent = displayContent + '\n\n' + parsed.afterText;
                          }
                        }
                      }
                      
                      return (
                        <div key={index} className={`history-message history-message-${msg.role}`}>
                          <div className="history-message-header">
                            <span className="history-message-role">
                              {msg.role === 'user' ? '👤 Tú' : '🤖 Alex'}
                            </span>
                            {msg.timestamp && (
                              <span className="history-message-time">
                                {new Date(msg.timestamp).toLocaleTimeString('es-ES', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            )}
                          </div>
                          <div className="history-message-content">
                            {displayContent.split('\n').map((line, lineIndex) => {
                              const trimmedLine = line.trim();
                              
                              // Procesar markdown básico para títulos de sección
                              if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
                                return (
                                  <div key={lineIndex} style={{ 
                                    fontWeight: '600', 
                                    fontSize: '1rem', 
                                    marginTop: lineIndex > 0 ? '16px' : '0',
                                    marginBottom: '8px',
                                    color: '#1e293b'
                                  }}>
                                    {trimmedLine.slice(2, -2)}
                                  </div>
                                );
                              }
                              // Procesar viñetas
                              if (trimmedLine.startsWith('•')) {
                                return (
                                  <div key={lineIndex} style={{ 
                                    marginLeft: '16px', 
                                    marginTop: '6px',
                                    marginBottom: '4px',
                                    lineHeight: '1.6'
                                  }}>
                                    {trimmedLine}
                                  </div>
                                );
                              }
                              // Líneas vacías
                              if (trimmedLine === '') {
                                return <br key={lineIndex} />;
                              }
                              // Línea normal
                              return (
                                <div key={lineIndex} style={{ 
                                  marginTop: lineIndex > 0 ? '8px' : '0',
                                  lineHeight: '1.6'
                                }}>
                                  {trimmedLine}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {conversationHistory.length > 0 && (
                <div className="history-panel-footer">
                  <button
                    type="button"
                    className="history-clear-button"
                    onClick={async () => {
                      if (sessionId && window.confirm('¿Estás seguro de que quieres limpiar el historial?')) {
                        try {
                          await axios.post(`${API_URL}/api/conversation/clear`, {
                            session_id: sessionId
                          });
                          setConversationHistory([]);
                          setShowHistory(false);
                        } catch (error) {
                          console.error('Error al limpiar historial:', error);
                        }
                      }
                    }}
                  >
                    Limpiar historial
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Panel de favoritos - Mis Viajes Guardados */}
        {showFavorites && (
          <div className="favorites-panel-overlay" onClick={() => setShowFavorites(false)}>
            <div className="favorites-panel" onClick={(e) => e.stopPropagation()}>
              <div className="favorites-panel-header">
                <h3 className="favorites-panel-title">
                  <Bookmark size={20} />
                  Mis Viajes Guardados
                </h3>
                <button
                  type="button"
                  className="favorites-panel-close"
                  onClick={() => setShowFavorites(false)}
                  aria-label="Cerrar favoritos"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="favorites-panel-content">
                {favorites.length === 0 ? (
                  <div className="favorites-empty">
                    <Bookmark size={48} />
                    <p>No hay viajes guardados</p>
                    <p className="favorites-empty-subtitle">Los destinos que consultes se guardarán automáticamente aquí</p>
                  </div>
                ) : (
                  <div className="favorites-list">
                    {favorites.map((favorite) => (
                      <div key={favorite.id} className="favorite-item">
                        <div className="favorite-item-header">
                          <div className="favorite-item-destination">
                            <MapPin size={18} className="favorite-item-icon" />
                            <div className="favorite-item-info">
                              <h4 className="favorite-item-title">{favorite.destination}</h4>
                              {(favorite.departureDate || favorite.returnDate) && (
                                <div className="favorite-item-dates">
                                  {favorite.departureDate && (
                                    <span className="favorite-date">
                                      <Calendar size={14} />
                                      Salida: {new Date(favorite.departureDate).toLocaleDateString('es-ES', { 
                                        day: 'numeric', 
                                        month: 'short', 
                                        year: 'numeric' 
                                      })}
                                    </span>
                                  )}
                                  {favorite.returnDate && (
                                    <span className="favorite-date">
                                      <Calendar size={14} />
                                      Regreso: {new Date(favorite.returnDate).toLocaleDateString('es-ES', { 
                                        day: 'numeric', 
                                        month: 'short', 
                                        year: 'numeric' 
                                      })}
                                    </span>
                                  )}
                                </div>
                              )}
                              <div className="favorite-item-saved">
                                Guardado el {new Date(favorite.savedAt).toLocaleDateString('es-ES', { 
                                  day: 'numeric', 
                                  month: 'long', 
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="favorite-item-actions">
                          <button
                            type="button"
                            className="favorite-action-button favorite-load-button"
                            onClick={() => loadFavoriteToForm(favorite)}
                            title="Cargar en formulario"
                          >
                            <ArrowLeft size={16} />
                            Cargar
                          </button>
                          <button
                            type="button"
                            className="favorite-action-button favorite-download-button"
                            onClick={() => downloadFavoritePDF(favorite)}
                            title="Descargar PDF"
                          >
                            <Download size={16} />
                            PDF
                          </button>
                          <button
                            type="button"
                            className="favorite-action-button favorite-delete-button"
                            onClick={() => handleDeleteFavorite(favorite)}
                            title="Eliminar favorito"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {favorites.length > 0 && (
                <div className="favorites-panel-footer">
                  <button
                    type="button"
                    className="favorites-clear-button"
                    onClick={handleDeleteAllFavorites}
                  >
                    Eliminar todos
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal de confirmación para eliminar favoritos */}
        {showDeleteModal && (
          <div className="delete-modal-overlay" onClick={cancelDeleteFavorite}>
            <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
              <div className="delete-modal-header">
                <AlertCircle size={24} className="delete-modal-icon" />
                <h3 className="delete-modal-title">Confirmar eliminación</h3>
              </div>
              <div className="delete-modal-content">
                <p>
                  {deleteAllFavorites
                    ? '¿Estás seguro de que quieres eliminar todos tus favoritos? Esta acción no se puede deshacer.'
                    : `¿Estás seguro de que quieres eliminar "${favoriteToDelete?.destination}" de tus favoritos?`}
                </p>
              </div>
              <div className="delete-modal-actions">
                <button
                  type="button"
                  className="delete-modal-cancel"
                  onClick={cancelDeleteFavorite}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="delete-modal-confirm"
                  onClick={confirmDeleteFavorite}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;

