export interface Stats {
  people_count: number;
  total_unique: number;
  fps: number;
  session_time: string;
  screenshots: number;
  running: boolean;
  paused: boolean;
}

export interface Settings {
  confidence: number;
  camera_index: number;
  model_name: string;
  show_labels: boolean;
  show_confidence: boolean;
  face_recognition_enabled: boolean;
  face_recognition_tolerance: number;
}

export interface Screenshot {
  name: string;
  size: number;
}

export interface FacePerson {
  name: string;
  sample_count: number;
}
