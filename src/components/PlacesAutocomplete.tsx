import React, { useEffect, useRef } from 'react';

interface PlacesAutocompleteProps {
  value: string;
  onChange: (address: string, city: string, district: string, lat: number, lng: number) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

const PlacesAutocomplete: React.FC<PlacesAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Adres girin...',
  className = '',
  id = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!inputRef.current || !window.google) return;

    if (autocompleteRef.current) {
      window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
    }

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'tr' },
      fields: ['address_components', 'geometry', 'formatted_address'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      
      if (!place.geometry || !place.geometry.location) {
        return;
      }

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const formattedAddress = place.formatted_address || '';

      let city = '';
      let district = '';

      if (place.address_components) {
        for (const component of place.address_components) {
          const types = component.types;
          
          if (types.includes('administrative_area_level_1') || types.includes('locality')) {
            city = component.long_name;
          }
          
          if (types.includes('administrative_area_level_2') || types.includes('sublocality') || types.includes('sublocality_level_1')) {
            district = component.long_name;
          }
        }
      }

      if (inputRef.current) {
        inputRef.current.value = formattedAddress;
      }

      onChangeRef.current(formattedAddress, city, district, lat, lng);
    });

    autocompleteRef.current = autocomplete;

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (inputRef.current && value && inputRef.current.value !== value) {
      inputRef.current.value = value;
    }
  }, [value]);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      className={className}
      id={id}
      required
    />
  );
};

export default PlacesAutocomplete;

