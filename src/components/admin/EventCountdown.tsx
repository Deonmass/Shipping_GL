import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, Play } from 'lucide-react';

interface EventCountdownProps {
  eventDate: string;
  compact?: boolean;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  status: 'future' | 'ongoing' | 'past';
}

export const EventCountdown: React.FC<EventCountdownProps> = ({ eventDate, compact = false }) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    status: 'future'
  });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const eventTime = new Date(eventDate).getTime();
      const difference = eventTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeRemaining({
          days,
          hours,
          minutes,
          seconds,
          status: 'future'
        });
      } else if (difference > -86400000) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          status: 'ongoing'
        });
      } else {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          status: 'past'
        });
      }
    };

    calculateTimeRemaining();
    const timer = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(timer);
  }, [eventDate]);

  if (timeRemaining.status === 'past') {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Terminé
      </span>
    );
  }

  if (timeRemaining.status === 'ongoing') {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 animate-pulse">
        <Play className="w-3 h-3 mr-1" />
        En cours
      </span>
    );
  }

  const getUrgencyColor = () => {
    if (timeRemaining.days === 0 && timeRemaining.hours < 24) {
      return 'bg-red-100 text-red-800';
    } else if (timeRemaining.days < 7) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-green-100 text-green-800';
  };

  if (compact) {
    if (timeRemaining.days > 0) {
      return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getUrgencyColor()}`}>
          <Clock className="w-3 h-3 mr-1" />
          {timeRemaining.days}j {timeRemaining.hours}h
        </span>
      );
    }

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getUrgencyColor()}`}>
        <Clock className="w-3 h-3 mr-1" />
        {timeRemaining.hours}h {timeRemaining.minutes}m
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold ${getUrgencyColor()}`}>
      <Clock className="w-4 h-4" />
      {timeRemaining.days > 0 && (
        <span>{timeRemaining.days} jour{timeRemaining.days > 1 ? 's' : ''}</span>
      )}
      {(timeRemaining.days > 0 || timeRemaining.hours > 0) && (
        <span>{timeRemaining.hours}h</span>
      )}
      <span>{timeRemaining.minutes}m</span>
      {timeRemaining.days === 0 && <span>{timeRemaining.seconds}s</span>}
    </div>
  );
};
