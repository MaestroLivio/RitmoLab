/**
 * LevelManager.js - State, Persistence and Progression Engine for RitmoLab's 88 Levels
 */

import { ALL_LEVELS, RHYTHMIC_LEVELS, MELODIC_LEVELS } from '../data/curriculum.js';

const STORAGE_KEY = 'ritmolab_progress_v1';

export class LevelManager {
  constructor() {
    this.progress = {
      unlockedLevels: ['R1', 'M1'], // First levels unlocked by default
      scores: {}, // { [levelId]: { stars: 3, accuracy: 92, completedAt: '...', savedNotes: [...] } }
      savedProjects: [], // User custom free compositions
    };
    this.loadProgress();
  }

  loadProgress() {
    if (typeof localStorage === 'undefined') return;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.progress = {
          unlockedLevels: Array.isArray(parsed.unlockedLevels) ? parsed.unlockedLevels : ['R1', 'M1'],
          scores: parsed.scores || {},
          savedProjects: parsed.savedProjects || [],
        };
      }
    } catch (e) {
      console.warn('Could not load progress from localStorage:', e);
    }
  }

  saveProgress() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
    } catch (e) {
      console.error('Could not save progress to localStorage:', e);
    }
  }

  getAllLevels() {
    return ALL_LEVELS;
  }

  getRhythmicLevels() {
    return RHYTHMIC_LEVELS;
  }

  getMelodicLevels() {
    return MELODIC_LEVELS;
  }

  getLevelById(id) {
    return ALL_LEVELS.find(lvl => lvl.id === id) || ALL_LEVELS[0];
  }

  getLevelStatus(id) {
    const isUnlocked = this.progress.unlockedLevels.includes(id) || id === 'R1' || id === 'M1';
    const scoreData = this.progress.scores[id] || { stars: 0, accuracy: 0, completed: false };
    return {
      unlocked: isUnlocked,
      stars: scoreData.stars || 0,
      accuracy: scoreData.accuracy || 0,
      completed: scoreData.completed || false,
    };
  }

  recordLevelCompletion(id, { stars = 1, accuracy = 100, savedNotes = null }) {
    const prev = this.progress.scores[id] || { stars: 0, accuracy: 0 };
    this.progress.scores[id] = {
      stars: Math.max(prev.stars, stars),
      accuracy: Math.max(prev.accuracy, accuracy),
      completed: true,
      completedAt: new Date().toISOString(),
      savedNotes: savedNotes || prev.savedNotes,
    };

    // Unlock next level in sequence
    this.unlockNextLevel(id);
    this.saveProgress();
  }

  unlockNextLevel(currentId) {
    const currentIdx = ALL_LEVELS.findIndex(l => l.id === currentId);
    if (currentIdx >= 0 && currentIdx < ALL_LEVELS.length - 1) {
      const nextLvl = ALL_LEVELS[currentIdx + 1];
      if (nextLvl && !this.progress.unlockedLevels.includes(nextLvl.id)) {
        this.progress.unlockedLevels.push(nextLvl.id);
      }
    }
  }

  unlockLevel(id) {
    if (id && !this.progress.unlockedLevels.includes(id)) {
      this.progress.unlockedLevels.push(id);
      this.saveProgress();
    }
  }

  unlockAllLevelsForTesting() {
    this.progress.unlockedLevels = ALL_LEVELS.map(l => l.id);
    this.saveProgress();
  }

  resetProgress() {
    this.progress = {
      unlockedLevels: ['R1', 'M1'],
      scores: {},
      savedProjects: [],
    };
    this.saveProgress();
  }

  getOverallStatistics() {
    const totalLevels = ALL_LEVELS.length; // 88
    const completedLevels = Object.values(this.progress.scores).filter(s => s.completed).length;
    let totalStarsEarned = 0;
    Object.values(this.progress.scores).forEach(s => {
      totalStarsEarned += (s.stars || 0);
    });
    const maxStars = totalLevels * 3;

    return {
      totalLevels,
      completedLevels,
      completionPercentage: Math.round((completedLevels / totalLevels) * 100),
      totalStarsEarned,
      maxStars,
      starsPercentage: Math.round((totalStarsEarned / maxStars) * 100),
    };
  }

  exportDataAsJSON() {
    return JSON.stringify(this.progress, null, 2);
  }

  importDataFromJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && typeof parsed === 'object') {
        this.progress = {
          unlockedLevels: Array.isArray(parsed.unlockedLevels) ? parsed.unlockedLevels : ['R1', 'M1'],
          scores: parsed.scores || {},
          savedProjects: parsed.savedProjects || [],
        };
        this.saveProgress();
        return true;
      }
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
    return false;
  }

  // --- FREE SANDBOX SAVED PROJECTS (PARTITURE LIBERE CREATE) ---

  saveProject({ id = null, title = 'Nuova Partitura', notes = [], bpm = 90, timeSignature = '4/4', sandboxMode = 'rhythm', sandboxStaff = 'pentagram', sandboxBars = 4 }) {
    const projectId = id || `proj_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const now = new Date().toISOString();

    const existingIdx = this.progress.savedProjects.findIndex(p => p.id === projectId);
    const projectData = {
      id: projectId,
      title: title || 'Partitura Senza Titolo',
      notes: [...notes],
      bpm: Number(bpm) || 90,
      timeSignature: timeSignature || '4/4',
      sandboxMode: sandboxMode || 'rhythm',
      sandboxStaff: sandboxStaff || 'pentagram',
      sandboxBars: Number(sandboxBars) || 4,
      updatedAt: now,
      createdAt: existingIdx >= 0 ? this.progress.savedProjects[existingIdx].createdAt : now,
    };

    if (existingIdx >= 0) {
      this.progress.savedProjects[existingIdx] = projectData;
    } else {
      this.progress.savedProjects.unshift(projectData);
    }

    this.saveProgress();
    return projectData;
  }

  getSavedProjects() {
    return Array.isArray(this.progress.savedProjects) ? this.progress.savedProjects : [];
  }

  getProjectById(id) {
    return this.getSavedProjects().find(p => p.id === id) || null;
  }

  deleteProject(id) {
    this.progress.savedProjects = this.getSavedProjects().filter(p => p.id !== id);
    this.saveProgress();
    return true;
  }
}

export const levelManager = new LevelManager();
