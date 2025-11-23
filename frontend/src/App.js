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
  MessageSquare
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
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselDirection, setCarouselDirection] = useState('right');
  const contentScrollRef = useRef(null);
  const lastFormDataRef = useRef(null);
  const lastTripTypeRef = useRef(null);
  const [isPending, startTransition] = useTransition();
  const [sessionId, setSessionId] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  
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
    
    setQuestion(preFilledQuestion);
    setShowForm(false);
    
    // IMPORTANTE: El caché solo se usa si:
    // 1. Los datos del formulario NO han cambiado
    // 2. Ya existe una respuesta previa
    // 3. Es una petición desde el FORMULARIO (no desde el chat)
    if (!hasChanged && response && response.trim().length > 0) {
      console.log('💾 [FORMULARIO] Usando respuesta en caché (datos del formulario no cambiaron)');
      console.log('⚠️ [FORMULARIO] NO se consulta a Gemini - usando respuesta previa');
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
      console.log('🌤️ Clima recibido (formulario):', result.data.weather);
      console.log('📸 Fotos recibidas (formulario):', result.data.photos);
      
      // Actualizar historial de conversación
      if (sessionId) {
        loadConversationHistory();
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
  const navigateCarousel = (direction) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!question.trim()) {
      console.log('⚠️ [CHAT] Pregunta vacía, no se envía');
      return;
    }

    const currentQuestion = question.trim();
    
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
      
      // Limpiar el input después de enviar
      setQuestion('');
      
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
    <div className="App">
      <div className="app-layout">
        <div className="container">
          <header className="header">
          <div className="header-left">
            <button 
              type="button"
              onClick={() => setShowForm(true)}
              className="back-to-form-button-header"
              title="Modificar información del viaje"
            >
              <ArrowLeft size={14} />
              <span>Modificar viaje</span>
            </button>
          </div>
          <div className="header-center">
            <h1 className="title">ViajeIA</h1>
            <p className="subtitle">
              Alex, tu Consultor Personal de Viajes{' '}
              <Luggage size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '4px' }} />
              <Plane size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '2px' }} />
            </p>
          </div>
          <div className="header-right">
            <button
              type="button"
              onClick={() => {
                setShowHistory(!showHistory);
                if (!showHistory && sessionId) {
                  loadConversationHistory();
                }
              }}
              className="history-button"
              title="Ver historial de conversaciones"
            >
              <History size={20} />
              {conversationHistory.length > 0 && (
                <span className="history-badge">{conversationHistory.length}</span>
              )}
            </button>
          </div>
        </header>

        <main className="main-content">

          <form onSubmit={handleSubmit} className="form">
            <div className="input-group">
              <textarea
                className="input-field"
                placeholder="¿A dónde quieres viajar? ¿Cuál es tu presupuesto? ¿Qué tipo de actividades te interesan?"
                value={question}
                onChange={(e) => {
                  const newValue = e.target.value;
                  
                  // IMPORTANTE: Si hay una respuesta previa y el usuario está escribiendo,
                  // limpiar solo la respuesta y fotos (específicos de la pregunta)
                  // MANTENER weather y realtimeInfo (relacionados con el destino)
                  if (response && response.trim().length > 0) {
                    // Si el usuario está modificando la pregunta, limpiar solo response y photos
                    if (newValue.trim() !== question.trim()) {
                      console.log('🧹 [CHAT] Usuario está modificando la pregunta');
                      console.log('🧹 [CHAT] Limpiando: response y photos (específicos de la pregunta)');
                      console.log('✅ [CHAT] MANTENIENDO: weather y realtimeInfo (relacionados con el destino)');
                      setResponse('');
                      setPhotos(null);
                      setCarouselIndex(0);
                      // NO limpiar weather ni realtimeInfo - son específicos del destino
                    }
                  }
                  
                  // Solo actualizar el estado, NO hacer consultas a Gemini
                  // Las consultas solo se hacen al hacer click en "Planificar mi viaje"
                  setQuestion(newValue);
                }}
                onKeyDown={(e) => {
                  // Permitir Enter para enviar, pero solo si se presiona Ctrl+Enter o Cmd+Enter
                  // Enter solo crea nueva línea
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                rows="4"
                disabled={loading}
              />
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="submit-button"
                disabled={loading || !question.trim()}
              >
                {loading ? (
                  <>
                    <span>Planificando...</span>
                  </>
                ) : (
                  <>
                    <span>Planificar mi viaje</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Solo mostrar respuesta si no está cargando y hay una respuesta válida */}
          {!loading && response && response.trim().length > 0 && (() => {
            const parsed = parsedResponse;
            
            if (parsed && parsed.sections && Object.keys(parsed.sections).length > 0) {
              // Mostrar carrusel si hay secciones
              const sectionKeys = Object.keys(parsed.sections);
              const validIndex = Math.min(carouselIndex, sectionKeys.length - 1);
              const currentSectionKey = sectionKeys[validIndex];
              const currentSectionContent = parsed.sections[currentSectionKey];

              if (!currentSectionKey || !currentSectionContent) {
                // Si no hay sección válida, mostrar respuesta normal
                return (
                  <div className="response-container">
                    <div className="response-header">
                      <h2>
                        Respuesta de Alex{' '}
                        <Luggage size={24} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '6px' }} />
                      </h2>
                    </div>
                    <div className="response-content">
                      <div className="response-text">{response}</div>
                    </div>
                  </div>
                );
              }

              const hasMultipleSections = sectionKeys.length > 1;

              return (
                <div className="response-container">
                  <div className="response-header">
                    <div className="response-header-left">
                      <h2>
                        Respuesta de Alex{' '}
                        <Luggage size={24} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '6px' }} />
                      </h2>
                    </div>
                    {weatherInfo && (
                      <div className="response-header-right">
                        <div className="weather-header-container">
                          <div className="weather-header-left">
                            <Cloud className="weather-main-icon" />
                            <div className="weather-header-left-content">
                              <div className="weather-label">Clima Actual en</div>
                              <div className="weather-city">{weatherInfo.city}</div>
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
                  </div>
                  <div className="response-content">
                    {/* Mostrar fotos del destino si están disponibles */}
                    {photos && photos.length > 0 && (
                      <div className="destination-photos-container">
                        <div className="destination-photos-header">
                          <Image size={20} className="photos-icon" />
                          <h3 className="destination-photos-title">Fotos del Destino</h3>
                        </div>
                        <div className="destination-photos-grid">
                          {photos.map((photo, index) => (
                            <div key={photo.id || index} className="destination-photo-item">
                              <a
                                href={photo.url_full || photo.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="destination-photo-link"
                                title={photo.description || `Foto de ${photo.photographer}`}
                              >
                                <img
                                  src={photo.url || photo.url_small}
                                  alt={photo.description || `Foto del destino`}
                                  className="destination-photo-image"
                                  loading="lazy"
                                />
                                <div className="destination-photo-overlay">
                                  <div className="destination-photo-credit">
                                    Foto por {photo.photographer}
                                  </div>
                                </div>
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Mostrar texto antes de las secciones solo si contiene información útil */}
                    {parsed.beforeText && parsed.beforeText.trim().length > 0 && (
                      <div className="response-text response-text-before">
                        {renderPlainText(parsed.beforeText)}
                      </div>
                    )}
                    
                    {/* Carrusel con las secciones */}
                    <div className="carousel-container">
                      <div className="carousel-slide">
                        <div className={`carousel-card ${carouselDirection === 'left' ? 'slide-left' : ''}`} key={validIndex}>
                          <div className="carousel-section-header">
                            <div className="carousel-section-header-left">
                              {hasMultipleSections && (
                                <button
                                  className="carousel-button carousel-button-left"
                                  onClick={() => navigateCarousel('prev')}
                                  aria-label="Sección anterior"
                                >
                                  <ChevronLeft size={18} />
                                </button>
                              )}
                              <h3 className="carousel-section-title">
                                <span className="carousel-section-icon">
                                  {getSectionIcon(currentSectionKey)}
                                </span>
                                {currentSectionKey}
                              </h3>
                            </div>
                            <div className="carousel-section-header-right">
                              {hasMultipleSections && (
                                <>
                                  <div className="carousel-indicator">
                                    {validIndex + 1} / {sectionKeys.length}
                                  </div>
                                  <button
                                    className="carousel-button carousel-button-right"
                                    onClick={() => navigateCarousel('next')}
                                    aria-label="Siguiente sección"
                                  >
                                    <ChevronRight size={18} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          <div 
                            className="carousel-section-content"
                            ref={contentScrollRef}
                          >
                            {renderSectionContent(currentSectionContent, currentSectionKey)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {hasMultipleSections && (
                      <div className="carousel-dots">
                        {sectionKeys.map((_, index) => (
                          <button
                            key={index}
                            className={`carousel-dot ${index === validIndex ? 'active' : ''}`}
                            onClick={() => setCarouselIndex(index)}
                            aria-label={`Ir a sección ${index + 1}`}
                          />
                        ))}
                      </div>
                    )}
                    
                    {/* Mostrar texto después de las secciones solo si contiene información útil */}
                    {parsed.afterText && parsed.afterText.trim().length > 0 && (
                      <div className="response-text response-text-after">
                        {renderPlainText(parsed.afterText)}
                      </div>
                    )}
                  </div>
                </div>
              );
            } else {
              // Mostrar respuesta normal si no hay secciones
              
              return (
                <div className="response-container">
                  <div className="response-header">
                    <div className="response-header-left">
                      <h2>
                        Respuesta de Alex{' '}
                        <Luggage size={24} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '6px' }} />
                      </h2>
                    </div>
                    {weatherInfo && (
                      <div className="response-header-right">
                        <div className="weather-header-container">
                          <div className="weather-header-left">
                            <Cloud className="weather-main-icon" />
                            <div className="weather-header-left-content">
                              <div className="weather-label">Clima Actual en</div>
                              <div className="weather-city">{weatherInfo.city}</div>
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
                  </div>
                  <div className="response-content">
                    {/* Mostrar fotos del destino si están disponibles */}
                    {photos && photos.length > 0 && (
                      <div className="destination-photos-container">
                        <div className="destination-photos-header">
                          <Image size={20} className="photos-icon" />
                          <h3 className="destination-photos-title">Fotos del Destino</h3>
                        </div>
                        <div className="destination-photos-grid">
                          {photos.map((photo, index) => (
                            <div key={photo.id || index} className="destination-photo-item">
                              <a
                                href={photo.url_full || photo.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="destination-photo-link"
                                title={photo.description || `Foto de ${photo.photographer}`}
                              >
                                <img
                                  src={photo.url || photo.url_small}
                                  alt={photo.description || `Foto del destino`}
                                  className="destination-photo-image"
                                  loading="lazy"
                                />
                                <div className="destination-photo-overlay">
                                  <div className="destination-photo-credit">
                                    Foto por {photo.photographer}
                                  </div>
                                </div>
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="response-text">
                      {renderPlainText(response)}
                    </div>
                  </div>
                </div>
              );
            }
          })()}
        </main>
        </div>
        
        {/* Botón flotante para información en tiempo real */}
        {realtimeInfo && !showForm && (
          <div className="realtime-info-wrapper">
            <button
              type="button"
              className="realtime-info-float-button"
              onClick={() => setShowRealtimePanel(!showRealtimePanel)}
              onMouseEnter={() => setShowRealtimePanel(true)}
              aria-label="Ver información en tiempo real"
              title="Información en tiempo real"
            >
              <Radio size={24} className="realtime-live-icon" />
              <span className="realtime-pulse"></span>
            </button>
            
            {/* Panel flotante de información en tiempo real */}
            {showRealtimePanel && (
              <div 
                className="realtime-info-panel-float"
                onMouseEnter={() => setShowRealtimePanel(true)}
                onMouseLeave={() => setShowRealtimePanel(false)}
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
            )}
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
      </div>
    </div>
  );
}

export default App;

