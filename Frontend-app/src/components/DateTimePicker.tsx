import React, { useState, useEffect } from 'react';
import { View, Platform, TouchableOpacity, Text, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDateTime } from '../utils/dateTimeUtils';
import { Icon } from './Icon';
import { colors } from '../styles/colors';

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
  minimumDate?: Date;
  maximumDate?: Date;
  label?: string;
  error?: string;
}

export const DateTimePickerComponent: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  mode = 'datetime',
  minimumDate,
  maximumDate,
  label,
  error,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [internalDate, setInternalDate] = useState<Date>(value || new Date());

  useEffect(() => {
    if (value) {
      setInternalDate(value);
    }
  }, [value]);

  const handleChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    
    if (event.type === 'dismissed' || !selectedDate) {
      return;
    }

    if (selectedDate) {
      // For Android, we need to update the internal state immediately
      if (Platform.OS === 'android') {
        setInternalDate(selectedDate);
      }
      onChange(selectedDate);
    }
  };

  const formatDisplayDate = () => {
    if (!internalDate) return 'Select date & time';
    
    if (mode === 'date') {
      return formatDateTime(internalDate, 'DD MMM YYYY');
    } else if (mode === 'time') {
      return formatDateTime(internalDate, 'hh:mm A');
    }
    return formatDateTime(internalDate, 'DD MMM YYYY, hh:mm A');
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.pickerButton, error ? styles.errorBorder : null]}
        onPress={() => setShowPicker(true)}
      >
        <Text style={styles.pickerText}>
          {formatDisplayDate()}
        </Text>
        <Icon name="calendar-month" size={20} color={colors.primary} />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      {(showPicker || Platform.OS === 'ios') && (
        <DateTimePicker
          value={internalDate}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          style={styles.picker}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#333',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
  },
  picker: {
    width: '100%',
  },
  errorBorder: {
    borderColor: '#ff3b30',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: 4,
  },
});
