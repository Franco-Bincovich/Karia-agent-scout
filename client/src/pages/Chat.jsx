// pages/Chat.jsx
// Pantalla principal de chat de KarIA Scout.
// Layout: sidebar colapsable + área de mensajes + input fijo abajo.

import { useChat } from '../hooks/useChat';
import Layout from '../components/layout/Layout';
import MessageList from '../components/chat/MessageList';
import ChatInput from '../components/chat/ChatInput';

export default function Chat() {
  const { mensajes, enviar, cargando, cargarConversacion } = useChat();

  return (
    <Layout onSeleccionarConversacion={cargarConversacion}>
      <MessageList mensajes={mensajes} cargando={cargando} />
      <ChatInput onEnviar={enviar} cargando={cargando} />
    </Layout>
  );
}
