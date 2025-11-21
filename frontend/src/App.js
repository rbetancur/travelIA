import React, { useState, useEffect, useRef } from 'react';
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
  Plus 
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
  const [loading, setLoading] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselDirection, setCarouselDirection] = useState('right');

  // Limpiar timeout al desmontar el componente
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

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

  const calculateDays = (departure, returnDate) => {
    if (!departure || !returnDate) return 0;
    const dep = new Date(departure);
    const ret = new Date(returnDate);
    const diffTime = Math.abs(ret - dep);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

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

  const loadPopularDestinations = async () => {
    // Si ya tenemos destinos populares cargados, no volver a cargar
    if (popularDestinations.length > 0) {
      return popularDestinations;
    }

    setLoadingDestinations(true);
    try {
      const result = await axios.get(`${API_URL}/api/destinations/popular`);
      if (result.data && result.data.destinations) {
        setPopularDestinations(result.data.destinations);
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
      setPopularDestinations(defaultDestinations);
      return defaultDestinations;
    } finally {
      setLoadingDestinations(false);
    }
    return [];
  };

  const searchDestinations = async (query) => {
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
  };

  const handleFormSubmit = (e) => {
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
    
    setShowForm(false);
    
    // Pre-llenar la pregunta con la información del formulario
    let preFilledQuestion;
    if (tripType === 'closed') {
      preFilledQuestion = `Quiero viajar a ${formData.destination} del ${formData.departureDate} al ${formData.returnDate} (${days} días) con un presupuesto de ${formData.budget}. ${travelersInfo}. Prefiero ${formData.preference}.`;
    } else {
      preFilledQuestion = `Quiero viajar a ${formData.destination} desde el ${formData.departureDate} (viaje abierto, sin fecha de regreso definida) con un presupuesto de ${formData.budget}. ${travelersInfo}. Prefiero ${formData.preference}.`;
    }
    setQuestion(preFilledQuestion);
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
          setDestinationSuggestions(filteredPopular.slice(0, 5));
          setShowSuggestions(true);
        }
        
        // Luego, buscar con Gemini usando debounce (500ms)
        searchTimeoutRef.current = setTimeout(async () => {
          const searchResults = await searchDestinations(value);
          if (searchResults.length > 0) {
            // Combinar resultados de búsqueda con destinos populares filtrados
            const combined = [...new Set([...filteredPopular, ...searchResults])].slice(0, 5);
            setDestinationSuggestions(combined);
            setShowSuggestions(true);
          } else if (filteredPopular.length === 0) {
            // Si no hay resultados de ninguna fuente, ocultar sugerencias
            setDestinationSuggestions([]);
            setShowSuggestions(false);
          }
        }, 500);
      } else {
        // Si no hay texto, mostrar los destinos populares (si están cargados)
        if (popularDestinations.length > 0) {
          setDestinationSuggestions(popularDestinations.slice(0, 5));
          setShowSuggestions(true);
        } else {
          // Si no hay destinos cargados, cargarlos
          loadPopularDestinations().then(destinations => {
            if (destinations.length > 0) {
              setDestinationSuggestions(destinations.slice(0, 5));
              setShowSuggestions(true);
            }
          });
        }
      }
    }
  };

  const handleDestinationSelect = (destination) => {
    setFormData(prev => ({
      ...prev,
      destination: destination
    }));
    setDestinationSuggestions([]);
    setShowSuggestions(false);
    setDestinationError('');
  };

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
      }
    }, 200);
  };

  // Función para parsear las secciones de la respuesta
  const parseResponseSections = (responseText) => {
    if (!responseText) return null;

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
    let lastSectionIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        // Si hay una sección activa, agregar línea vacía al contenido
        if (currentSection) {
          currentContent.push('');
        } else if (firstSectionIndex === -1) {
          // Antes de la primera sección
          beforeText.push(line);
        } else {
          // Después de la última sección
          afterText.push(line);
        }
        continue;
      }

      // Verificar si la línea es un encabezado de sección
      let isSectionHeader = false;
      let matchedSectionName = null;
      
      for (const sectionName of sectionNames) {
        const upperLine = trimmedLine.toUpperCase();
        // Buscar patrones como "ALOJAMIENTO |", "ALOJAMIENTO:", "ALOJAMIENTO" al inicio de línea
        if (upperLine.startsWith(sectionName)) {
          // Verificar que después del nombre haya un separador o fin de línea
          const remaining = upperLine.substring(sectionName.length).trim();
          if (remaining === '' || remaining.startsWith('|') || remaining.startsWith(':')) {
            // Guardar la sección anterior si existe
            if (currentSection) {
              sections[currentSection] = currentContent.join('\n').trim();
              lastSectionIndex = i - 1;
            }
            
            // Marcar el inicio de la primera sección
            if (firstSectionIndex === -1) {
              firstSectionIndex = i;
            }
            
            // Iniciar nueva sección
            currentSection = sectionName;
            currentContent = [];
            isSectionHeader = true;
            matchedSectionName = sectionName;
            
            // Extraer contenido de la misma línea si existe (formato "SECCIÓN | contenido" o "SECCIÓN: contenido")
            const separatorIndex = trimmedLine.toUpperCase().indexOf(sectionName) + sectionName.length;
            const afterSection = trimmedLine.substring(separatorIndex).trim();
            if (afterSection) {
              // Remover separadores (| o :)
              const content = afterSection.replace(/^[|:]\s*/, '').trim();
              if (content) {
                currentContent.push(content);
              }
            }
            break;
          }
        }
      }

      if (!isSectionHeader) {
        if (currentSection) {
          // Agregar contenido a la sección actual
          currentContent.push(line);
        } else if (firstSectionIndex === -1) {
          // Antes de la primera sección
          beforeText.push(line);
        } else {
          // Después de la última sección (pero solo si ya terminamos todas las secciones)
          // Esto se manejará después del loop
        }
      }
    }

    // Guardar la última sección
    if (currentSection) {
      sections[currentSection] = currentContent.join('\n').trim();
      lastSectionIndex = lines.length - 1;
    }

    // Extraer texto después de las secciones
    if (lastSectionIndex >= 0 && lastSectionIndex < lines.length - 1) {
      afterText = lines.slice(lastSectionIndex + 1);
    }

    // Verificar si encontramos al menos una sección
    if (Object.keys(sections).length > 0) {
      return {
        sections: sections,
        beforeText: beforeText.join('\n').trim(),
        afterText: afterText.join('\n').trim()
      };
    }

    return null;
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
      return;
    }

    setLoading(true);
    setResponse('');
    setCarouselIndex(0);

    try {
      const result = await axios.post(`${API_URL}/api/travel`, {
        question: question.trim(),
      });

      setResponse(result.data.answer);
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
                          setDestinationSuggestions(filtered.slice(0, 5));
                          setShowSuggestions(true);
                        }
                        
                        // Buscar con Gemini
                        const searchResults = await searchDestinations(formData.destination);
                        if (searchResults.length > 0) {
                          const combined = [...new Set([...filtered, ...searchResults])].slice(0, 5);
                          setDestinationSuggestions(combined);
                          setShowSuggestions(true);
                        } else if (filtered.length > 0) {
                          setDestinationSuggestions(filtered.slice(0, 5));
                          setShowSuggestions(true);
                        }
                      } else {
                        // Si no hay texto, mostrar los destinos populares
                        if (destinations.length > 0) {
                          setDestinationSuggestions(destinations.slice(0, 5));
                          setShowSuggestions(true);
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

                {tripType === 'closed' && formData.departureDate && formData.returnDate && (
                  <div className="days-info-row">
                    {calculateDays(formData.departureDate, formData.returnDate) > 30 ? (
                      <span className="long-trip-warning-inline">
                        Viaje largo: más de 30 días. Asegúrate de tener suficiente presupuesto y documentación.
                      </span>
                    ) : (
                      <span className="days-info-text">
                        {calculateDays(formData.departureDate, formData.returnDate)} {calculateDays(formData.departureDate, formData.returnDate) === 1 ? 'día' : 'días'} de viaje
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
          <button 
            type="button"
            onClick={() => setShowForm(true)}
            className="back-to-form-button"
          >
            <ArrowLeft size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }} />
            Modificar información del viaje
          </button>

          <form onSubmit={handleSubmit} className="form">
            <div className="input-group">
              <textarea
                className="input-field"
                placeholder="¿A dónde quieres viajar? ¿Cuál es tu presupuesto? ¿Qué tipo de actividades te interesan?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows="4"
                disabled={loading}
              />
            </div>
            
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading || !question.trim()}
            >
              {loading ? 'Planificando...' : 'Planificar mi viaje'}
            </button>
          </form>

          {response && (() => {
            const parsed = parseResponseSections(response);
            
            if (parsed && parsed.sections) {
              // Mostrar carrusel si hay secciones
              const sectionKeys = Object.keys(parsed.sections);
              const currentSectionKey = sectionKeys[carouselIndex];
              const currentSectionContent = parsed.sections[currentSectionKey];

              return (
                <div className="response-container">
                  <div className="response-header">
                    <h2>
                      Respuesta de Alex{' '}
                      <Luggage size={24} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '6px' }} />
                    </h2>
                  </div>
                  <div className="response-content">
                    {/* Mostrar texto antes de las secciones si existe */}
                    {parsed.beforeText && (
                      <div className="response-text response-text-before">
                        {parsed.beforeText}
                      </div>
                    )}
                    
                    {/* Carrusel con las secciones */}
                    <div className="carousel-container">
                      <button
                        className="carousel-button carousel-button-left"
                        onClick={() => navigateCarousel('prev')}
                        aria-label="Sección anterior"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      
                      <div className="carousel-slide">
                        <div className={`carousel-card ${carouselDirection === 'left' ? 'slide-left' : ''}`} key={carouselIndex}>
                          <div className="carousel-section-header">
                            <h3 className="carousel-section-title">{currentSectionKey}</h3>
                            <div className="carousel-indicator">
                              {carouselIndex + 1} / {sectionKeys.length}
                            </div>
                          </div>
                          <div className="carousel-section-content">
                            <div className="response-text">{currentSectionContent}</div>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        className="carousel-button carousel-button-right"
                        onClick={() => navigateCarousel('next')}
                        aria-label="Siguiente sección"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </div>
                    
                    <div className="carousel-dots">
                      {sectionKeys.map((_, index) => (
                        <button
                          key={index}
                          className={`carousel-dot ${index === carouselIndex ? 'active' : ''}`}
                          onClick={() => setCarouselIndex(index)}
                          aria-label={`Ir a sección ${index + 1}`}
                        />
                      ))}
                    </div>
                    
                    {/* Mostrar texto después de las secciones si existe */}
                    {parsed.afterText && (
                      <div className="response-text response-text-after">
                        {parsed.afterText}
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
          })()}
        </main>
      </div>
    </div>
  );
}

export default App;

