"use client";

import React, { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';

const OnboardingTour = () => {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenTour) {
      setRun(true);
    }
  }, []);

  const steps: Step[] = [
    {
      target: '.tour-scripts-header',
      content: 'Welcome to ScriptFlow! This is your script library where all your creative works live.',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '.tour-stats',
      content: 'Monitor your production progress, page counts, and collaborations at a glance.',
      placement: 'bottom',
    },
    {
      target: '.tour-new-script',
      content: 'Ready to start something new? Click here to create a screenplay and define your character DNA.',
      placement: 'left',
    },
    {
      target: '.tour-tabs',
      content: 'Easily organize your scripts by Recent, Shared, or Archived status.',
      placement: 'top',
    },
    {
      target: '.tour-profile',
      content: 'Manage your production team, billing, and security settings here.',
      placement: 'bottom',
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRun(false);
      localStorage.setItem('hasSeenOnboarding', 'true');
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
          zIndex: 1000,
        },
      }}
    />
  );
};

export default OnboardingTour;