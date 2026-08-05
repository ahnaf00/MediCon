import { Colors } from '@theme';

export interface ProtocolStep {
  id: string;
  instruction: string;
  warning?: string;
}

export type AgeBand = 'adult' | 'child' | 'infant';

export interface EmergencyProtocol {
  id: string;
  title: string;
  description: string;
  iconName: string; // Lucide icon name
  callEmergencyServices: boolean;
  color: string; // Visual indicator color
  steps: {
    adult: ProtocolStep[];
    child?: ProtocolStep[]; // Falls back to adult if undefined
    infant?: ProtocolStep[]; // Falls back to child/adult if undefined
  };
}

export const EMERGENCY_PROTOCOLS: Record<string, EmergencyProtocol> = {
  cpr: {
    id: 'cpr',
    title: 'CPR (Cardiopulmonary Resuscitation)',
    description: 'Use when a person is unresponsive and not breathing normally.',
    iconName: 'activity',
    callEmergencyServices: true,
    color: Colors.danger,
    steps: {
      adult: [
        {
          id: '1',
          instruction:
            'Ensure the scene is safe, then check for responsiveness by tapping the shoulder and shouting, "Are you OK?"',
        },
        {
          id: '2',
          instruction: 'Call emergency services immediately and get an AED if available.',
          warning: 'Do not leave the person unless you are alone and have no mobile phone.',
        },
        {
          id: '3',
          instruction:
            'Check for normal breathing for no more than 10 seconds. Gasps are not normal breathing.',
        },
        {
          id: '4',
          instruction:
            'Place the heel of one hand in the center of the chest, and the other hand on top. Interlace your fingers.',
        },
        {
          id: '5',
          instruction:
            'Push hard and fast. Compress the chest at least 2 inches deep at a rate of 100 to 120 compressions per minute.',
          warning: 'Allow the chest to return to its normal position after each compression.',
        },
        {
          id: '6',
          instruction:
            'If trained, give 2 rescue breaths after every 30 compressions. Otherwise, continue hands-only CPR.',
        },
        {
          id: '7',
          instruction:
            'Use the AED as soon as it arrives. Turn it on and follow the voice prompts.',
        },
        {
          id: '8',
          instruction:
            'Continue CPR until the person shows signs of life, an AED is ready to use, or EMS personnel take over.',
        },
      ],
      child: [
        {
          id: '1',
          instruction:
            'Check for responsiveness. If alone, provide 2 minutes of CPR before leaving to call emergency services.',
        },
        { id: '2', instruction: 'Check for normal breathing for no more than 10 seconds.' },
        { id: '3', instruction: 'Place the heel of one or two hands in the center of the chest.' },
        {
          id: '4',
          instruction:
            'Compress the chest about 2 inches deep (at least one third the depth of the chest) at a rate of 100 to 120 per minute.',
        },
        { id: '5', instruction: 'Give 30 compressions followed by 2 rescue breaths (if trained).' },
        { id: '6', instruction: 'Continue until help arrives or the child shows signs of life.' },
      ],
      infant: [
        {
          id: '1',
          instruction:
            'Check for responsiveness by tapping the bottom of the foot. If alone, provide 2 minutes of CPR before calling for help.',
        },
        { id: '2', instruction: 'Check for normal breathing for no more than 10 seconds.' },
        {
          id: '3',
          instruction: 'Place two fingers in the center of the chest, just below the nipple line.',
        },
        {
          id: '4',
          instruction:
            'Compress the chest about 1.5 inches deep (at least one third the depth of the chest) at a rate of 100 to 120 per minute.',
        },
        {
          id: '5',
          instruction:
            'Give 30 compressions followed by 2 gentle rescue breaths (covering both mouth and nose with your mouth).',
        },
        { id: '6', instruction: 'Continue until help arrives or the infant shows signs of life.' },
      ],
    },
  },
  choking: {
    id: 'choking',
    title: 'Choking',
    description: 'Use when a person cannot speak, cough, or breathe.',
    iconName: 'user-x',
    callEmergencyServices: true,
    color: Colors.danger,
    steps: {
      adult: [
        {
          id: '1',
          instruction:
            'Ask the person "Are you choking?" If they cannot speak or cough forcefully, proceed to help.',
        },
        {
          id: '2',
          instruction: 'Call emergency services immediately or instruct someone else to do it.',
        },
        {
          id: '3',
          instruction:
            'Stand behind the person. Give 5 back blows between the shoulder blades with the heel of your hand.',
        },
        {
          id: '4',
          instruction:
            'Give 5 abdominal thrusts (Heimlich maneuver). Place a fist just above the navel, grab it with your other hand, and pull inward and upward.',
        },
        {
          id: '5',
          instruction:
            'Continue alternating 5 back blows and 5 abdominal thrusts until the object is forced out or the person can cough forcefully or breathe.',
        },
        {
          id: '6',
          instruction:
            'If the person becomes unresponsive, lower them to the ground and begin CPR, starting with chest compressions.',
          warning:
            'Check the mouth for the object before giving rescue breaths, but do not perform a blind finger sweep.',
        },
      ],
      child: [
        { id: '1', instruction: 'Kneel behind the child to be at their height.' },
        { id: '2', instruction: 'Give 5 back blows between the shoulder blades.' },
        { id: '3', instruction: 'Give 5 abdominal thrusts just above the navel.' },
        {
          id: '4',
          instruction:
            'Alternate 5 back blows and 5 abdominal thrusts until the object is cleared.',
        },
        {
          id: '5',
          instruction: 'If the child becomes unresponsive, lower them to the ground and begin CPR.',
        },
      ],
      infant: [
        {
          id: '1',
          instruction:
            'Hold the infant face down on your forearm, supporting their head and jaw with your hand. Rest your forearm on your thigh.',
        },
        {
          id: '2',
          instruction:
            'Give 5 firm back blows between the shoulder blades with the heel of your other hand.',
        },
        {
          id: '3',
          instruction: 'Turn the infant face up, supporting the head. Rest your arm on your thigh.',
        },
        {
          id: '4',
          instruction:
            'Place two fingers in the center of the chest just below the nipple line and give 5 quick chest thrusts (about 1.5 inches deep).',
        },
        {
          id: '5',
          instruction:
            'Alternate 5 back blows and 5 chest thrusts until the object is cleared or the infant can breathe or cry.',
        },
        { id: '6', instruction: 'If the infant becomes unresponsive, begin infant CPR.' },
      ],
    },
  },
  'severe-bleeding': {
    id: 'severe-bleeding',
    title: 'Severe Bleeding',
    description: 'Use for life-threatening bleeding that cannot be stopped easily.',
    iconName: 'droplet',
    callEmergencyServices: true,
    color: Colors.danger,
    steps: {
      adult: [
        { id: '1', instruction: 'Ensure your own safety. Put on medical gloves if available.' },
        {
          id: '2',
          instruction:
            'Call emergency services immediately for any severe, spurting, or uncontrollable bleeding.',
        },
        { id: '3', instruction: 'Cover the wound with a clean cloth or sterile dressing.' },
        {
          id: '4',
          instruction: 'Apply direct, firm pressure directly over the wound with both hands.',
          warning:
            'Do not remove the first cloth if it becomes soaked. Add another cloth on top and continue pressing.',
        },
        {
          id: '5',
          instruction:
            'If bleeding does not stop with direct pressure, and the wound is on an arm or leg, consider using a tourniquet if you are trained to do so.',
        },
        {
          id: '6',
          instruction: 'Keep the person warm and monitor for signs of shock until help arrives.',
        },
      ],
    },
  },
  burns: {
    id: 'burns',
    title: 'Burns',
    description: 'Use for thermal burns from heat, fire, or hot liquids.',
    iconName: 'flame',
    callEmergencyServices: false, // Conditionally true, but base protocol says call if severe
    color: '#ff8c00',
    steps: {
      adult: [
        {
          id: '1',
          instruction:
            'Stop the burning process immediately. Move the person away from the heat source.',
        },
        {
          id: '2',
          instruction:
            'Cool the burn with cool (not freezing cold) running water for at least 10 to 20 minutes.',
          warning: 'Never apply ice, butter, ointments, or toothpaste to a severe burn.',
        },
        {
          id: '3',
          instruction:
            'Remove any clothing or jewelry near the burn area, unless it is stuck to the skin.',
        },
        {
          id: '4',
          instruction:
            'Cover the burn loosely with a sterile, non-stick dressing or a clean cloth.',
        },
        {
          id: '5',
          instruction:
            'Call emergency services if the burn is severe, covers a large area, involves the face, hands, or genitals, or causes difficulty breathing.',
        },
      ],
    },
  },

  'heat-stroke': {
    id: 'heat-stroke',
    title: 'Heat Stroke',
    description: 'Use when a person has a very high body temperature and altered mental state.',
    iconName: 'sun',
    callEmergencyServices: true,
    color: Colors.danger,
    steps: {
      adult: [
        {
          id: '1',
          instruction:
            'Recognize the signs: confusion, passing out, dizziness, seizures, hot and dry skin (or heavy sweating in some cases).',
        },
        { id: '2', instruction: 'Call emergency services immediately.' },
        { id: '3', instruction: 'Move the person to a cooler place, preferably air-conditioned.' },
        {
          id: '4',
          instruction:
            'Cool the person immediately. Immerse them in cold water up to the neck if possible, or spray them with cold water and fan vigorously.',
          warning:
            'Cooling the person rapidly is the most critical step to prevent death or brain damage.',
        },
        { id: '5', instruction: 'Place ice packs on the neck, armpits, and groin if available.' },
        {
          id: '6',
          instruction:
            'Do not force the person to drink fluids if they are confused or unconscious.',
        },
      ],
    },
  },
  'heat-exhaustion': {
    id: 'heat-exhaustion',
    title: 'Heat Exhaustion',
    description:
      'Use when a person experiences heavy sweating, weakness, and nausea from heat exposure.',
    iconName: 'thermometer',
    callEmergencyServices: false,
    color: '#ff8c00',
    steps: {
      adult: [
        { id: '1', instruction: 'Move the person to a cooler environment immediately.' },
        { id: '2', instruction: 'Have the person lie down and loosen or remove extra clothing.' },
        {
          id: '3',
          instruction:
            'Cool the person by applying cool, wet cloths to the skin or misting with cool water.',
        },
        {
          id: '4',
          instruction:
            'If the person is fully awake and able to swallow, give them cool water or a sports drink to sip slowly.',
        },
        {
          id: '5',
          instruction: 'Monitor the person closely.',
          warning:
            'If the person vomits, their condition worsens, or they do not improve within 30 minutes, call emergency services.',
        },
      ],
    },
  },
  unconscious: {
    id: 'unconscious',
    title: 'Unconscious (Recovery Position)',
    description: 'Use when a person is unresponsive but is breathing normally.',
    iconName: 'bed',
    callEmergencyServices: true,
    color: Colors.secondary,
    steps: {
      adult: [
        { id: '1', instruction: 'Check the person for responsiveness and normal breathing.' },
        { id: '2', instruction: 'Call emergency services immediately.' },
        {
          id: '3',
          instruction:
            'If the person is breathing normally and there is no suspected spinal injury, roll them onto their side into the recovery position.',
        },
        {
          id: '4',
          instruction:
            'To place in recovery position: extend the arm nearest you at a right angle. Bring the far arm across the chest and place the back of the hand against the cheek nearest you.',
        },
        {
          id: '5',
          instruction:
            'Grab the far leg just above the knee, pull it up so the foot is flat on the ground. Roll the person toward you onto their side.',
        },
        {
          id: '6',
          instruction:
            'Tilt the head back slightly to keep the airway open. Adjust the top leg so both the hip and knee are bent at right angles.',
        },
        {
          id: '7',
          instruction:
            'Stay with the person and monitor their breathing continuously until help arrives. If they stop breathing, begin CPR.',
          warning:
            'Do not move the person if you suspect a head, neck, or spinal injury, unless their airway is blocked.',
        },
      ],
    },
  },
};

/**
 * Retrieves the appropriate protocol steps for a given age band, safely falling back
 * to adult instructions if specific pediatric instructions do not exist.
 */
export const getProtocolStepsForAge = (
  protocol: EmergencyProtocol,
  age: AgeBand,
): ProtocolStep[] => {
  if (age === 'infant' && protocol.steps.infant) {
    return protocol.steps.infant;
  }
  if ((age === 'child' || age === 'infant') && protocol.steps.child) {
    return protocol.steps.child;
  }
  return protocol.steps.adult;
};
