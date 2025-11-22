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
  Plus,
  Hotel,
  UtensilsCrossed,
  Lightbulb,
  DollarSign
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
  const contentScrollRef = useRef(null);
  const lastFormDataRef = useRef(null);
  const lastTripTypeRef = useRef(null);

  // Limpiar timeout al desmontar el componente
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Función para actualizar indicadores de scroll
  const updateScrollIndicators = (element) => {
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
  };

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
    
    // Si no hay cambios y ya existe una respuesta, conservarla
    if (!hasChanged && response && response.trim().length > 0) {
      // No hacer petición, solo mostrar la respuesta existente
      return;
    }
    
    // Si hay cambios o no hay respuesta previa, hacer la petición
    setLoading(true);
    setResponse('');
    setCarouselIndex(0);
    
    // Guardar los datos actuales para la próxima comparación
    lastFormDataRef.current = currentFormData;
    lastTripTypeRef.current = tripType;

    try {
      const result = await axios.post(`${API_URL}/api/travel`, {
        question: preFilledQuestion.trim(),
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

  // Función para limpiar texto técnico innecesario
  const cleanText = (text) => {
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
  };

  // Función para parsear las secciones de la respuesta
  // El backend ahora genera respuestas en formato JSON estructurado
  const parseResponseSections = (responseText) => {
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

    console.log('=== PARSING RESULT (JSON) ===');
    console.log('Secciones detectadas:', Object.keys(sections));
    
    // Log detallado por sección
    Object.keys(sections).forEach(section => {
      const content = sections[section];
      const contentLines = content.split('\n');
      const nonEmptyLines = contentLines.filter(l => l.trim());
      console.log(`\n${section}:`);
      console.log(`  - Total recomendaciones: ${nonEmptyLines.length}`);
      console.log(`  - Primeras 3 recomendaciones:`, nonEmptyLines.slice(0, 3));
    });
    
    if (beforeText) {
      console.log('\nTexto antes de JSON:', beforeText);
    }
    if (afterText) {
      console.log('\nTexto después de JSON:', afterText);
    }

    return {
      sections: sections,
      beforeText: beforeText,
      afterText: afterText
    };
  };

  // Función de respaldo para parsear formato TOON legacy (por si acaso)
  const parseResponseSectionsLegacy = (responseText) => {
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
          <button 
            type="button"
            onClick={() => setShowForm(true)}
            className="back-to-form-button-header"
            title="Modificar información del viaje"
          >
            <ArrowLeft size={14} />
            <span>Modificar viaje</span>
          </button>
          <h1 className="title">ViajeIA</h1>
          <p className="subtitle">
            Alex, tu Consultor Personal de Viajes{' '}
            <Luggage size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '4px' }} />
            <Plane size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '2px' }} />
          </p>
        </header>

        <main className="main-content">

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

          {response && (() => {
            const parsed = parseResponseSections(response);
            
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
                    <h2>
                      Respuesta de Alex{' '}
                      <Luggage size={24} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '6px' }} />
                    </h2>
                  </div>
                  <div className="response-content">
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
                    <h2>
                      Respuesta de Alex{' '}
                      <Luggage size={24} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '6px' }} />
                    </h2>
                  </div>
                  <div className="response-content">
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
    </div>
  );
}

export default App;

