import { useLanguage } from '../contexts/LanguageContext';

// Translation mapping for measurements
export const measurementTranslations = {
  // English measurements
  'Length (Full or Desired)': 'length',
  'Bust': 'bust',
  'Waist': 'waist',
  'Hip': 'hip',
  'Shoulder': 'shoulder',
  'Armhole': 'armhole',
  'Sleeve Length': 'sleeveLength',
  'Sleeve Round': 'sleeveRound',
  'Neck Depth (Front)': 'neckDepthFront',
  'Neck Depth (Back)': 'neckDepthBack',
  'Neck Width': 'neckWidth',
  'Side Slit Length': 'sideSlitLength',
  'Bottom Opening Round': 'bottomOpeningRound',
  'Thigh Round': 'thighRound',
  'Knee Round': 'kneeRound',
  'Calf Round': 'calfRound',
  'Ankle Round': 'ankleRound',
  'Inseam Length': 'inseamLength',
  'Outseam Length': 'outseamLength',
  'Salwar Belt Height (Kamar Patti)': 'salwarBeltHeight',
  'Ghera of Salwar / Hem Width': 'ghera',
  'Churidar Length': 'churidarLength',
  'Ankle Fit': 'ankleFit',
  'Underbust': 'underbust',
  'Shoulder Width': 'shoulderWidth',
  'Blouse Length': 'blouseLength',
  'Front Neck': 'frontNeck',
  'Back Neck': 'backNeck',
  'Waist to Knee': 'waistToKnee',
  'Waist to Ankle': 'waistToAnkle',
  'Body Height': 'bodyHeight',
  'Bust Round with Ease': 'bustRoundEase',
  'Maternity Ease Allowance': 'maternityEase',
  'Jumpsuit Crotch Length': 'jumpsuitCrotchLength',
  'Across Front': 'acrossFront',
  'Across Back': 'acrossBack',
  'Bust Point to Bust Point (Apex Distance)': 'bustPointDistance',
  'Underbust Length': 'underbustLength',
  'Back Opening Width': 'backOpeningWidth',
  'Dori Length (if needed)': 'doriLength',
  'Lehenga Length': 'lehengaLength',
  'Bottom Ghera': 'bottomGhera',
  'Zip preference': 'zipPreference',
  'Can-can requirement': 'canCanRequirement',
  'Full Length': 'fullLength',
  'Neck Depth': 'neckDepth',
};

// Function to get translated measurements
export const getTranslatedMeasurements = (t) => {
  const translateLabel = (label) => {
    const translationKey = measurementTranslations[label];
    return translationKey ? t(translationKey) : label;
  };

  const translateGarmentType = (garmentType) => {
    return {
      ...garmentType,
      measurements: garmentType.measurements.map(measurement => ({
        ...measurement,
        label: translateLabel(measurement.label)
      }))
    };
  };

  const translateAdditionalMeasurements = (measurements) => {
    return measurements.map(measurement => ({
      ...measurement,
      label: translateLabel(measurement.label)
    }));
  };

  const translateOrderStatuses = (statuses) => {
    return statuses.map(status => ({
      ...status,
      label: t(status.value)
    }));
  };

  return {
    garmentTypes: Object.keys(garmentTypes).reduce((acc, key) => {
      acc[key] = translateGarmentType(garmentTypes[key]);
      return acc;
    }, {}),
    additionalMeasurements: translateAdditionalMeasurements(additionalMeasurements),
    orderStatuses: translateOrderStatuses(orderStatuses)
  };
};

export const garmentTypes = {
  kurti: {
    name: 'Kurti / Kameez / Top',
    measurements: [
      { id: 'length', label: 'Length (Full or Desired)', unit: 'inch' },
      { id: 'bust', label: 'Bust', unit: 'inch' },
      { id: 'waist', label: 'Waist', unit: 'inch' },
      { id: 'hip', label: 'Hip', unit: 'inch' },
      { id: 'shoulder', label: 'Shoulder', unit: 'inch' },
      { id: 'armhole', label: 'Armhole', unit: 'inch' },
      { id: 'sleeve_length', label: 'Sleeve Length', unit: 'inch' },
      { id: 'sleeve_round', label: 'Sleeve Round', unit: 'inch' },
      { id: 'neck_depth_front', label: 'Neck Depth (Front)', unit: 'inch' },
      { id: 'neck_depth_back', label: 'Neck Depth (Back)', unit: 'inch' },
      { id: 'neck_width', label: 'Neck Width', unit: 'inch' },
      { id: 'side_slit_length', label: 'Side Slit Length', unit: 'inch' },
      { id: 'bottom_opening_round', label: 'Bottom Opening Round', unit: 'inch' },
    ]
  },
  salwar: {
    name: 'Salwar / Pant / Churidar',
    measurements: [
      { id: 'waist', label: 'Waist', unit: 'inch' },
      { id: 'hip', label: 'Hip', unit: 'inch' },
      { id: 'thigh_round', label: 'Thigh Round', unit: 'inch' },
      { id: 'knee_round', label: 'Knee Round', unit: 'inch' },
      { id: 'calf_round', label: 'Calf Round', unit: 'inch' },
      { id: 'ankle_round', label: 'Ankle Round', unit: 'inch' },
      { id: 'inseam_length', label: 'Inseam Length', unit: 'inch' },
      { id: 'outseam_length', label: 'Outseam Length', unit: 'inch' },
      { id: 'salwar_belt_height', label: 'Salwar Belt Height (Kamar Patti)', unit: 'inch' },
      { id: 'ghera', label: 'Ghera of Salwar / Hem Width', unit: 'inch' },
      { id: 'churidar_length', label: 'Churidar Length', unit: 'inch' },
      { id: 'ankle_fit', label: 'Ankle Fit', unit: 'inch' },
    ]
  },
  blouse: {
    name: 'Blouse (Saree Blouse)',
    measurements: [
      { id: 'bust', label: 'Bust', unit: 'inch' },
      { id: 'underbust', label: 'Underbust', unit: 'inch' },
      { id: 'waist', label: 'Waist', unit: 'inch' },
      { id: 'shoulder_width', label: 'Shoulder Width', unit: 'inch' },
      { id: 'neck_depth_front', label: 'Neck Depth (Front)', unit: 'inch' },
      { id: 'neck_depth_back', label: 'Neck Depth (Back)', unit: 'inch' },
      { id: 'neck_width', label: 'Neck Width', unit: 'inch' },
      { id: 'armhole', label: 'Armhole', unit: 'inch' },
      { id: 'sleeve_length', label: 'Sleeve Length', unit: 'inch' },
      { id: 'sleeve_round', label: 'Sleeve Round', unit: 'inch' },
      { id: 'blouse_length', label: 'Blouse Length', unit: 'inch' },
      { id: 'across_front', label: 'Across Front', unit: 'inch' },
      { id: 'across_back', label: 'Across Back', unit: 'inch' },
      { id: 'bust_point_distance', label: 'Bust Point to Bust Point (Apex Distance)', unit: 'inch' },
      { id: 'underbust_length', label: 'Underbust Length', unit: 'inch' },
      { id: 'back_opening_width', label: 'Back Opening Width', unit: 'inch' },
      { id: 'dori_length', label: 'Dori Length (if needed)', unit: 'inch' },
    ]
  },
  lehenga: {
    name: 'Lehenga / Skirt',
    measurements: [
      { id: 'waist', label: 'Waist', unit: 'inch' },
      { id: 'hip', label: 'Hip', unit: 'inch' },
      { id: 'lehenga_length', label: 'Lehenga Length', unit: 'inch' },
      { id: 'bottom_ghera', label: 'Bottom Ghera', unit: 'inch' },
      { id: 'zip_preference', label: 'Zip preference', unit: 'text' },
      { id: 'can_can', label: 'Can-can requirement', unit: 'boolean' },
    ]
  },
  gown: {
    name: 'Gown / Anarkali',
    measurements: [
      { id: 'full_length', label: 'Full Length', unit: 'inch' },
      { id: 'bust', label: 'Bust', unit: 'inch' },
      { id: 'waist', label: 'Waist', unit: 'inch' },
      { id: 'hip', label: 'Hip', unit: 'inch' },
      { id: 'shoulder', label: 'Shoulder', unit: 'inch' },
      { id: 'armhole', label: 'Armhole', unit: 'inch' },
      { id: 'sleeve_length', label: 'Sleeve Length', unit: 'inch' },
      { id: 'sleeve_round', label: 'Sleeve Round', unit: 'inch' },
      { id: 'neck_depth', label: 'Neck Depth', unit: 'inch' },
      { id: 'neck_width', label: 'Neck Width', unit: 'inch' },
      { id: 'yoke_length', label: 'Yoke Length', unit: 'inch' },
      { id: 'anarkali_ghera', label: 'Anarkali Ghera (flare)', unit: 'inch' },
      { id: 'upper_body_length', label: 'Upper Body Length', unit: 'inch' },
    ]
  },
  dress: {
    name: 'Dress / Western Wear',
    measurements: [
      { id: 'full_length', label: 'Full Length', unit: 'inch' },
      { id: 'bust', label: 'Bust', unit: 'inch' },
      { id: 'waist', label: 'Waist', unit: 'inch' },
      { id: 'hip', label: 'Hip', unit: 'inch' },
      { id: 'shoulder_width', label: 'Shoulder Width', unit: 'inch' },
      { id: 'armhole', label: 'Armhole', unit: 'inch' },
      { id: 'sleeve_length', label: 'Sleeve Length', unit: 'inch' },
      { id: 'sleeve_round', label: 'Sleeve Round', unit: 'inch' },
      { id: 'neck_depth', label: 'Neck Depth', unit: 'inch' },
      { id: 'neck_width', label: 'Neck Width', unit: 'inch' },
    ]
  },
  other: {
    name: 'Other',
    measurements: [
      { id: 'custom_measurement_1', label: 'Custom Measurement 1', unit: 'inch' },
      { id: 'custom_measurement_2', label: 'Custom Measurement 2', unit: 'inch' },
      { id: 'custom_measurement_3', label: 'Custom Measurement 3', unit: 'inch' },
      { id: 'notes', label: 'Additional Notes', unit: 'text' },
    ]
  }
};

export const generalMeasurements = [
  { id: 'bust_chest', label: 'Bust / Chest', unit: 'inch' },
  { id: 'waist', label: 'Waist', unit: 'inch' },
  { id: 'hip', label: 'Hip', unit: 'inch' },
  { id: 'shoulder_width', label: 'Shoulder Width', unit: 'inch' },
  { id: 'back_width', label: 'Back Width', unit: 'inch' },
  { id: 'front_neck_depth', label: 'Front Neck Depth', unit: 'inch' },
  { id: 'back_neck_depth', label: 'Back Neck Depth', unit: 'inch' },
  { id: 'neck_round', label: 'Neck Round', unit: 'inch' },
  { id: 'armhole', label: 'Armhole', unit: 'inch' },
  { id: 'sleeve_length', label: 'Sleeve Length', unit: 'inch' },
  { id: 'sleeve_round_bicep', label: 'Sleeve Round (bicep)', unit: 'inch' },
  { id: 'elbow_round', label: 'Elbow Round', unit: 'inch' },
  { id: 'wrist_round', label: 'Wrist Round', unit: 'inch' },
  { id: 'upper_arm_length', label: 'Upper Arm Length', unit: 'inch' },
  { id: 'across_front', label: 'Across Front', unit: 'inch' },
  { id: 'across_back', label: 'Across Back', unit: 'inch' },
];

export const additionalMeasurements = [
  { id: 'torso_length', label: 'Torso Length', unit: 'inch' },
  { id: 'waist_position', label: 'Waist Position (High/Mid/Low)', unit: 'text' },
  { id: 'body_height', label: 'Body Height', unit: 'inch' },
  { id: 'bust_round_ease', label: 'Bust Round with Ease', unit: 'inch' },
  { id: 'maternity_ease', label: 'Maternity Ease Allowance', unit: 'inch' },
  { id: 'jumpsuit_crotch_length', label: 'Jumpsuit Crotch Length', unit: 'inch' },
];

export const orderStatuses = [
  { value: 'pending', label: 'Pending', color: '#ffc107' },
  { value: 'in_progress', label: 'In Progress', color: '#17a2b8' },
  { value: 'ready', label: 'Ready', color: '#28a745' },
  { value: 'delivered', label: 'Delivered', color: '#6c757d' },
  { value: 'cancelled', label: 'Cancelled', color: '#dc3545' },
];
