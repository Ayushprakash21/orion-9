import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export type EntityType = 'inventory' | 'product' | 'supplier' | 'po' | 'shipment' | 'inbound' | 'exception' | 'action' | 'import' | 'connector' | 'dataset' | 'prediction' | 'sync' | null;

interface EntityDrawerContextType {
  activeEntity: { type: EntityType; id: string } | null;
  openEntity: (type: EntityType | { type: EntityType; id: string }, id?: string) => void;
  closeEntity: () => void;
  confirmModal: {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
  } | null;
  showConfirmModal: (title: string, message: string, onConfirm: () => void, confirmText?: string) => void;
  hideConfirmModal: () => void;
}

const EntityDrawerContext = createContext<EntityDrawerContextType | undefined>(undefined);

export const EntityDrawerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeEntity, setActiveEntity] = useState<{ type: EntityType; id: string } | null>(() => {
    const entity = searchParams.get('entity') as EntityType;
    const id = searchParams.get('id');
    if (entity && id) {
      return { type: entity, id };
    }
    return null;
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
  } | null>(null);

  useEffect(() => {
    const entity = searchParams.get('entity') as EntityType;
    const id = searchParams.get('id');
    if (entity && id) {
      setActiveEntity({ type: entity, id });
    } else {
      setActiveEntity(null);
    }
  }, [searchParams]);

  const openEntity = useCallback((arg1: any, arg2?: string) => {
    let type: EntityType = null;
    let id: string = '';
    if (typeof arg1 === 'object' && arg1 !== null) {
      type = arg1.type;
      id = arg1.id;
    } else {
      type = arg1;
      id = arg2 || '';
    }
    setActiveEntity({ type, id });
    const newParams = new URLSearchParams(searchParams);
    if (type) newParams.set('entity', type);
    else newParams.delete('entity');
    if (id) newParams.set('id', id);
    else newParams.delete('id');
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const closeEntity = useCallback(() => {
    setActiveEntity(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('entity');
    newParams.delete('id');
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const showConfirmModal = (title: string, message: string, onConfirm: () => void, confirmText = 'Confirm') => {
    setConfirmModal({ isOpen: true, title, message, onConfirm, confirmText });
  };

  const hideConfirmModal = () => {
    setConfirmModal(null);
  };

  return (
    <EntityDrawerContext.Provider value={{ activeEntity, openEntity, closeEntity, confirmModal, showConfirmModal, hideConfirmModal }}>
      {children}
    </EntityDrawerContext.Provider>
  );
};

export const useEntityDrawer = () => {
  const context = useContext(EntityDrawerContext);
  if (!context) {
    return {
      activeEntity: null,
      openEntity: () => {},
      closeEntity: () => {},
      confirmModal: null,
      showConfirmModal: () => {},
      hideConfirmModal: () => {},
    };
  }
  return context;
};
