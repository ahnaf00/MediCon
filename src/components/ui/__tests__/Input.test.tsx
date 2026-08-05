import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Input } from '../Input';

describe('Input', () => {
  it('renders with a label', async () => {
    await render(<Input label="Email" />);
    expect(screen.getByText('Email')).toBeTruthy();
  });

  it('calls onChangeText when text changes', async () => {
    const onChangeText = jest.fn();
    await render(<Input label="Name" onChangeText={onChangeText} testID="name-input" />);

    const input = screen.getByTestId('name-input');
    fireEvent.changeText(input, 'John');
    expect(onChangeText).toHaveBeenCalledWith('John');
  });

  it('displays the current value', async () => {
    await render(<Input label="Name" value="Alice" testID="name-input" />);
    const input = screen.getByTestId('name-input');
    expect(input.props.value).toBe('Alice');
  });

  it('displays an error message', async () => {
    await render(<Input label="Phone" error="Phone number is required" />);
    expect(screen.getByText('Phone number is required')).toBeTruthy();
  });

  it('is not editable when disabled', async () => {
    await render(<Input label="Name" disabled testID="name-input" />);
    const input = screen.getByTestId('name-input');
    expect(input.props.editable).toBe(false);
  });
});
