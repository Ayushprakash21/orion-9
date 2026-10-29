import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

import { FilterChips } from '../src/components/FilterChips';
import { QuickPromptsBar } from '../src/features/ai/QuickPromptsBar';
import { ChatMessage } from '../src/features/ai/ChatMessage';
import { AIMessage } from '../src/types';

describe('Orion-9 Mobile UI Components & Layout Tests', () => {
  it('renders FilterChips with explicit touchable chips and badges', () => {
    const onSelect = jest.fn();
    const options = [
      { id: 'all', label: 'All Alerts', count: 4 },
      { id: 'critical', label: 'Critical', count: 2 },
    ];

    const { getByText } = render(
      <FilterChips
        options={options}
        selectedId="all"
        onSelect={onSelect}
      />
    );

    expect(getByText('All Alerts')).toBeTruthy();
    expect(getByText('4')).toBeTruthy();
    expect(getByText('Critical')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();

    fireEvent.press(getByText('Critical'));
    expect(onSelect).toHaveBeenCalledWith('critical');
  });

  it('renders QuickPromptsBar with non-stretched preset action pills', () => {
    const onSelectPrompt = jest.fn();
    const { getByText } = render(
      <QuickPromptsBar onSelectPrompt={onSelectPrompt} />
    );

    const presetPill = getByText('Network Health');
    expect(presetPill).toBeTruthy();

    fireEvent.press(presetPill);
    expect(onSelectPrompt).toHaveBeenCalledWith(
      'Summarize operational network health and top critical risks.'
    );
  });

  it('formats markdown in ChatMessage eliminating raw asterisks and bullets', () => {
    const message: AIMessage = {
      id: 'test-msg-1',
      role: 'assistant',
      text:
        `### Operational Status\n` +
        `**Network Health Highlights:**\n` +
        `- **Logistics Fabric**: 98% nominal\n` +
        `- **Buffer Deficit**: SKU-1000 risk`,
      timestamp: '12:00 PM',
      evidence: [
        {
          source: 'Telemetry Fabric',
          metric: 'Health Index',
          value: '98%',
          groundingType: 'KNOWN',
        },
      ],
    };

    const { getByText, queryByText } = render(
      <ChatMessage message={message} />
    );

    // Formatted header should exist without the raw '### ' prefix
    expect(getByText('Operational Status')).toBeTruthy();
    expect(queryByText('### Operational Status')).toBeNull();

    // Formatted subheader should exist without the raw '**' delimiters
    expect(getByText('Network Health Highlights:')).toBeTruthy();
    expect(queryByText('**Network Health Highlights:**')).toBeNull();

    // Grounding evidence should render
    expect(getByText('KNOWN')).toBeTruthy();
    expect(getByText(/Health Index:\s*98%/)).toBeTruthy();
  });
});
