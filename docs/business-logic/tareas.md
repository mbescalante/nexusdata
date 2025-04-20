---
sidebar_position: 5
title: Tareas en Segundo Plano
description: Implementación de tareas en segundo plano y trabajos programados en NexusData
---

# Tareas en Segundo Plano

Las tareas en segundo plano te permiten ejecutar procesos que requieren mucho tiempo o recursos sin bloquear el hilo principal de tu aplicación, mejorando la experiencia del usuario y el rendimiento general.

## Tipos de tareas

NexusData soporta varios tipos de tareas en segundo plano:

1. **Tareas inmediatas**: Se ejecutan tan pronto como sea posible
2. **Tareas programadas**: Se ejecutan en momentos específicos
3. **Tareas recurrentes**: Se ejecutan periódicamente según un horario definido
4. **Tareas condicionales**: Se ejecutan cuando se cumplen ciertas condiciones

## Configuración del sistema de tareas

Para utilizar el sistema de tareas, debes configurarlo en tu archivo de configuración:

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  tasks: {
    enabled: true,
    driver: 'redis', // 'redis', 'database', 'memory'
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD
    },
    concurrency: 5, // Número máximo de tareas concurrentes
    defaultQueue: 'default',
    queues: [
      {
        name: 'default',
        concurrency: 3
      },
      {
        name: 'emails',
        concurrency: 5
      },
      {
        name: 'reports',
        concurrency: 1
      },
      {
        name: 'imports',
        concurrency: 2
      }
    ],
    retries: 3, // Número de reintentos por defecto
    retryDelay: 60000, // Tiempo de espera entre reintentos (ms)
    timeout: 300000, // Tiempo máximo de ejecución (ms)
    removeOnComplete: true, // Eliminar tareas completadas
    removeOnFail: false // Mantener tareas fallidas para análisis
  }
};
```

## Definición de tareas

### Creación de un procesador de tareas

```javascript
// src/tasks/GenerateReportTask.js
import { Task } from '@nexusdata/core';

class GenerateReportTask extends Task {
  // Nombre de la tarea
  static name = 'generate-report';
  
  // Cola a la que pertenece
  static queue = 'reports';
  
  // Número de reintentos
  static retries = 2;
  
  // Tiempo de espera entre reintentos (ms)
  static retryDelay = 120000;
  
  // Tiempo máximo de ejecución (ms)
  static timeout = 600000;
  
  // Método principal que ejecuta la tarea
  async handle(data, context) {
    const { reportId, userId, parameters } = data;
    
    try {
      // Actualizar estado del reporte
      await context.db.update('Report', {
        id: reportId,
        status: 'processing',
        startedAt: new Date()
      });
      
      // Obtener datos para el reporte
      const reportData = await this.fetchReportData(parameters, context);
      
      // Generar archivo del reporte
      const fileUrl = await this.generateReportFile(reportData, parameters, context);
      
      // Actualizar reporte con resultados
      await context.db.update('Report', {
        id: reportId,
        status: 'completed',
        completedAt: new Date(),
        fileUrl,
        resultData: reportData.summary
      });
      
      // Notificar al usuario
      await context.db.create('Notification', {
        userId,
        type: 'report_completed',
        title: 'Reporte completado',
        message: 'Tu reporte ha sido generado y está listo para descargar.',
        data: { reportId, fileUrl },
        read: false,
        createdAt: new Date()
      });
      
      // Enviar correo electrónico
      await context.services.EmailService.sendReportCompletionEmail(userId, reportId, fileUrl);
      
      return { success: true, reportId, fileUrl };
    } catch (error) {
      // Registrar error
      await context.db.create('TaskError', {
        taskName: 'generate-report',
        relatedId: reportId,
        error: error.message,
        stack: error.stack,
        data: JSON.stringify(data),
        createdAt: new Date()
      });
      
      // Actualizar estado del reporte
      await context.db.update('Report', {
        id: reportId,
        status: 'failed',
        error: error.message
      });
      
      // Notificar al usuario sobre el error
      await context.db.create('Notification', {
        userId,
        type: 'report_failed',
        title: 'Error en generación de reporte',
        message: `Ocurrió un error al generar tu reporte: ${error.message}`,
        data: { reportId },
        read: false,
        createdAt: new Date()
      });
      
      // Re-lanzar el error para que el sistema de tareas lo maneje
      throw error;
    }
  }
  
  async fetchReportData(parameters, context) {
    // Implementación para obtener datos del reporte
    // ...
    
    return {
      // Datos del reporte
      items: [],
      summary: {}
    };
  }
  
  async generateReportFile(data, parameters, context) {
    // Implementación para generar archivo (PDF, Excel, etc.)
    // ...
    
    return 'https://storage.example.com/reports/report-123.pdf';
  }
  
  // Método que se ejecuta si la tarea falla después de todos los reintentos
  async failed(data, error, context) {
    const { reportId, userId } = data;
    
    // Enviar notificación al equipo de soporte
    await context.services.NotificationService.notifyTeam('support', {
      title: 'Fallo crítico en generación de reporte',
      message: `Reporte #${reportId} falló después de ${this.constructor.retries} intentos: ${error.message}`,
      data: { reportId, error: error.message, userId }
    });
  }
  
  // Método que se ejecuta antes de cada intento
  async beforeAttempt(data, attemptNumber, context) {
    const { reportId } = data;
    
    // Registrar intento
    await context.db.create('TaskAttempt', {
      taskName: 'generate-report',
      relatedId: reportId,
      attemptNumber,
      startedAt: new Date()
    });
    
    // Actualizar estado del reporte si es un reintento
    if (attemptNumber > 1) {
      await context.db.update('Report', {
        id: reportId,
        status: 'retrying',
        retryCount: attemptNumber - 1
      });
    }
  }
  
  // Método que se ejecuta después de cada intento
  async afterAttempt(data, attemptNumber, success, error, context) {
    const { reportId } = data;
    
    // Actualizar registro de intento
    await context.db.update('TaskAttempt', {
      where: {
        taskName: 'generate-report',
        relatedId: reportId,
        attemptNumber
      },
      data: {
        completedAt: new Date(),
        success,
        error: error ? error.message : null
      }
    });
  }
}

export default GenerateReportTask;
```

### Registro de tareas

Para que tus tareas estén disponibles en la aplicación, debes registrarlas en el archivo de configuración:

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  tasks: {
    // ... configuración de tareas
    handlers: [
      'src/tasks/GenerateReportTask',
      'src/tasks/ProcessImportTask',
      'src/tasks/SendBulkEmailTask',
      'src/tasks/CleanupFilesTask'
    ]
  }
};
```

## Programación de tareas

### Tareas inmediatas

```javascript
// src/services/ReportService.js
import { Service } from '@nexusdata/core';

class ReportService extends Service {
  async createReport(data, context) {
    // Crear registro de reporte
    const report = await this.db.create('Report', {
      name: data.name,
      type: data.type,
      parameters: data.parameters,
      userId: context.user.id,
      status: 'pending',
      createdAt: new Date()
    });
    
    // Programar tarea inmediata
    await this.tasks.dispatch('generate-report', {
      reportId: report.id,
      userId: context.user.id,
      parameters: data.parameters
    });
    
    return report;
  }
}

export default ReportService;
```

### Tareas programadas

```javascript
// src/services/EmailCampaignService.js
import { Service } from '@nexusdata/core';

class EmailCampaignService extends Service {
  async scheduleCampaign(data, context) {
    // Validar fecha de envío
    const sendAt = new Date(data.sendAt);
    
    if (sendAt <= new Date()) {
      throw new Error('La fecha de envío debe ser en el futuro');
    }
    
    // Crear campaña
    const campaign = await this.db.create('EmailCampaign', {
      name: data.name,
      subject: data.subject,
      content: data.content,
      recipientListId: data.recipientListId,
      status: 'scheduled',
      scheduledFor: sendAt,
      createdBy: context.user.id,
      createdAt: new Date()
    });
    
    // Programar tarea para una fecha específica
    await this.tasks.schedule('send-bulk-email', {
      campaignId: campaign.id,
      recipientListId: data.recipientListId
    }, {
      runAt: sendAt
    });
    
    return campaign;
  }
}

export default EmailCampaignService;
```

### Tareas recurrentes

```javascript
// src/tasks/schedulers/RecurringTasksScheduler.js
import { TaskScheduler } from '@nexusdata/core';

class RecurringTasksScheduler extends TaskScheduler {
  initialize() {
    // Tarea diaria a medianoche
    this.schedule('cleanup-files', {}, {
      cron: '0 0 * * *', // Formato cron: minuto hora día-mes mes día-semana
      timezone: 'Europe/Madrid'
    });
    
    // Tarea semanal los lunes a las 8:00 AM
    this.schedule('generate-weekly-report', {
      reportType: 'weekly-summary'
    }, {
      cron: '0 8 * * 1',
      timezone: 'Europe/Madrid'
    });
    
    // Tarea mensual el primer día del mes
    this.schedule('generate-monthly-report', {
      reportType: 'monthly-summary'
    }, {
      cron: '0 9 1 * *',
      timezone: 'Europe/Madrid'
    });
    
    // Tarea cada 15 minutos
    this.schedule('check-pending-orders', {}, {
      cron: '*/15 * * * *'
    });
    
    // Tarea cada hora durante horario laboral
    this.schedule('sync-inventory', {}, {
      cron: '0 9-18 * * 1-5' // Cada hora de 9 AM a 6 PM, lunes a viernes
    });
  }
}

export default RecurringTasksScheduler;
```

### Registro de programadores

```javascript
// nexusdata.config.js
module.exports = {
  // ... otras configuraciones
  tasks: {
    // ... configuración de tareas
    schedulers: [
      'src/tasks/schedulers/RecurringTasksScheduler',
      'src/tasks/schedulers/MaintenanceTasksScheduler'
    ]
  }
};
```

## Monitoreo y gestión de tareas

### Servicio de administración de tareas

```javascript
// src/services/TaskManagerService.js
import { Service } from '@nexusdata/core';

class TaskManagerService extends Service {
  async getTaskStatus(taskId) {
    return this.tasks.getStatus(taskId);
  }
  
  async listPendingTasks(queue = null, limit = 100) {
    return this.tasks.listPending(queue, limit);
  }
  
  async listActiveTasks(queue = null) {
    return this.tasks.listActive(queue);
  }
  
  async listFailedTasks(queue = null, limit = 100) {
    return this.tasks.listFailed(queue, limit);
  }
  
  async retryTask(taskId) {
    return this.tasks.retry(taskId);
  }
  
  async retryAllFailedTasks(queue = null) {
    return this.tasks.retryAllFailed(queue);
  }
  
  async cancelTask(taskId) {
    return this.tasks.cancel(taskId);
  }
  
  async pauseQueue(queue) {
    return this.tasks.pauseQueue(queue);
  }
  
  async resumeQueue(queue) {
    return this.tasks.resumeQueue(queue);
  }
  
  async getQueueStats(queue = null) {
    return this.tasks.getQueueStats(queue);
  }
  
  async clearQueue(queue) {
    return this.tasks.clearQueue(queue);
  }
}

export default TaskManagerService;
```

## Ejemplos de tareas comunes

### Procesamiento de importaciones

```javascript
// src/tasks/ProcessImportTask.js
import { Task } from '@nexusdata/core';
import fs from 'fs';
import csv from 'csv-parser';

class ProcessImportTask extends Task {
  static name = 'process-import';
  static queue = 'imports';
  static retries = 2;
  static timeout = 1800000; // 30 minutos
  
  async handle(data, context) {
    const { importId, filePath, options } = data;
    
    try {
      // Actualizar estado de importación
      await context.db.update('Import', {
        id: importId,
        status: 'processing',
        startedAt: new Date()
      });
      
      // Procesar archivo
      const results = await this.processFile(filePath, options, context);
      
      // Actualizar estado de importación
      await context.db.update('Import', {
        id: importId,
        status: 'completed',
        completedAt: new Date(),
        processedRows: results.processed,
        successRows: results.success,
        errorRows: results.errors.length,
        summary: results.summary
      });
      
      // Guardar errores detallados
      if (results.errors.length > 0) {
        for (const error of results.errors) {
          await context.db.create('ImportError', {
            importId,
            row: error.row,
            column: error.column,
            value: error.value,
            error: error.message,
            createdAt: new Date()
          });
        }
      }
      
      // Notificar al usuario
      const importRecord = await context.db.findOne('Import', { id: importId });
      
      await context.db.create('Notification', {
        userId: importRecord.createdBy,
        type: 'import_completed',
        title: 'Importación completada',
        message: `Tu importación "${importRecord.name}" ha sido procesada. ${results.success} registros importados correctamente.`,
        data: { importId, results: results.summary },
        read: false,
        createdAt: new Date()
      });
      
      return results;
    } catch (error) {
      // Actualizar estado de importación
      await context.db.update('Import', {
        id: importId,
        status: 'failed',
        error: error.message
      });
      
      // Notificar al usuario
      const importRecord = await context.db.findOne('Import', { id: importId });
      
      await context.db.create('Notification', {
        userId: importRecord.createdBy,
        type: 'import_failed',
        title: 'Error en importación',
        message: `Ocurrió un error al procesar tu importación "${importRecord.name}": ${error.message}`,
        data: { importId },
        read: false,
        createdAt: new Date()
      });
      
      throw error;
    }
  }
  
  async processFile(filePath, options, context) {
    const results = {
      processed: 0,
      success: 0,
      errors: [],
      summary: {}
    };
    
    return new Promise((resolve, reject) => {
      const rows = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          rows.push(row);
        })
        .on('end', async () => {
          try {
            // Procesar filas en lotes para mejor rendimiento
            const batchSize = 100;
            
            for (let i = 0; i < rows.length; i += batchSize) {
              const batch = rows.slice(i, i + batchSize);
              
              // Procesar lote
              await context.db.transaction(async (tx) => {
                for (const [index, row] of batch.entries()) {
                  try {
                    results.processed++;
                    
                    // Transformar datos según el tipo de importación
                    const transformedData = this.transformRow(row, options);
                    
                    // Validar datos
                    this.validateRow(transformedData, options);
                    
                    // Insertar o actualizar en la base de datos
                    if (options.updateExisting && transformedData.id) {
                      await tx.update(options.model, transformedData);
                    } else {
                      await tx.create(options.model, transformedData);
                    }
                    
                    results.success++;
                  } catch (error) {
                    results.errors.push({
                      row: i + index + 1, // +1 para contar el encabezado
                      data: row,
                      message: error.message
                    });
                  }
                }
              });
              
              // Actualizar progreso
              await context.db.update('Import', {
                id: options.importId,
                progress: Math.floor((i + batch.length) / rows.length * 100)
              });
            }
            
            // Generar resumen
            results.summary = {
              total: rows.length,
              processed: results.processed,
              success: results.success,
              failed: results.errors.length
            };
            
            resolve(results);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }
  
  transformRow(row, options) {
    // Implementación específica según el tipo de importación
    // ...
    
    return transformedData;
  }
  
  validateRow(data, options) {
    // Implementación específica según el tipo de importación
    // ...
    
    if (!valid) {
      throw new Error('Datos inválidos');
    }
  }
}

export default ProcessImportTask;
```

### Envío de correos masivos

```javascript
// src/tasks/SendBulkEmailTask.js
import { Task } from '@nexusdata/core';

class SendBulkEmailTask extends Task {
  static name = 'send-bulk-email';
  static queue = 'emails';
  static retries = 3;
  static timeout = 3600000; // 1 hora
  
  async handle(data, context) {
    const { campaignId } = data;
    
    try {
      // Obtener campaña
      const campaign = await context.db.findOne('EmailCampaign', { id: campaignId });
      
      if (!campaign) {
        throw new Error(`Campaña no encontrada: ${campaignId}`);
      }
      
      // Actualizar estado
      await context.db.update('EmailCampaign', {
        id: campaignId,
        status: 'sending',
        startedAt: new Date()
      });
      
      // Obtener lista de destinatarios
      const recipients = await context.db.findMany('EmailRecipient', {
        where: { listId: campaign.recipientListId }
      });
      
      // Inicializar contadores
      let sent = 0;
      let failed = 0;
      const errors = [];
      
      // Enviar correos en lotes
      const batchSize = 50;
      
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        
        // Procesar lote
        const results = await Promise.allSettled(
          batch.map(recipient => this.sendEmail(recipient, campaign, context))
        );
        
        // Actualizar contadores
        for (const result of results) {
          if (result.status === 'fulfilled') {
            sent++;
          } else {
            failed++;
            errors.push({
              email: result.reason.email,
              error: result.reason.message
            });
          }
        }
        
        // Actualizar progreso
        await context.db.update('EmailCampaign', {
          id: campaignId,
          progress: Math.floor((i + batch.length) / recipients.length * 100),
          sentCount: sent,
          failedCount: failed
        });
      }
      
      // Actualizar estado final
      await context.db.update('EmailCampaign', {
        id: campaignId,
        status: 'completed',
        completedAt: new Date(),
        sentCount: sent,
        failedCount: failed,
        summary: {
          total: recipients.length,
          sent,
          failed,
          errors: errors.slice(0, 100) // Limitar número de errores guardados
        }
      });
      
      // Notificar al creador
      await context.db.create('Notification', {
        userId: campaign.createdBy,
        type: 'campaign_completed',
        title: 'Campaña de correo completada',
        message: `Tu campaña "${campaign.name}" ha sido enviada. ${sent} correos enviados correctamente.`,
        data: { campaignId, sent, failed },
        read: false,
        createdAt: new Date()
      });
      
      return {
        campaignId,
        total: recipients.length,
        sent,
        failed
      };
    } catch (error) {
      // Actualizar estado en caso de error
      await context.db.update('EmailCampaign', {
        id: campaignId,
        status: 'failed',
        error: error.message
      });
      
      // Notificar al creador
      const campaign = await context.db.findOne('EmailCampaign', { id: campaignId });
      
      await context.db.create('Notification', {
        userId: campaign.createdBy,
        type: 'campaign_failed',
        title: 'Error en campaña de correo',
        message: `Ocurrió un error al enviar tu campaña "${campaign.name}": ${error.message}`,
        data: { campaignId },
        read: false,
        createdAt: new Date()
      });
      
      throw error;
    }
  }
  
  async sendEmail(recipient, campaign, context) {
    try {
      // Personalizar contenido
      const personalizedContent = this.personalizeContent(campaign.content, recipient);
      
      // Enviar correo
      await context.services.EmailService.send({
        to: recipient.email,
        subject: campaign.subject,
        html: personalizedContent,
        from: campaign.fromEmail || 'noreply@example.com',
        campaignId: campaign.id
      });
      
      // Registrar envío exitoso
      await context.db.create('EmailLog', {
        campaignId: campaign.id,
        recipientId: recipient.id,
        email: recipient.email,
        status: 'sent',
        sentAt: new Date()
      });
      
      return { success: true, email: recipient.email };
    } catch (error) {
      // Registrar error
      await context.db.create('EmailLog', {
        campaignId: campaign.id,
        recipientId: recipient.id,
        email: recipient.email,
        status: 'failed',
        error: error.message,
        sentAt: new Date()
      });
      
      throw { email: recipient.email, message: error.message };
    }
  }
  
  personalizeContent(content, recipient) {
    // Reemplazar variables de plantilla
    let personalized = content;
    
    // Reemplazar variables básicas
    personalized = personalized.replace(/{{name}}/g, recipient.name || '');
    personalized = personalized.replace(/{{email}}/g, recipient.email);
    
    // Reemplazar variables personalizadas
    if (recipient.data) {
      for (const [key, value] of Object.entries(recipient.data)) {
        personalized = personalized.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
      }
    }
    
    return personalized;
  }
}

export default SendBulkEmailTask;
```

## Mejores prácticas

1. **Idempotencia**: Diseña tus tareas para ser idempotentes (pueden ejecutarse múltiples veces sin efectos secundarios).
2. **Transacciones**: Usa transacciones para operaciones que modifican múltiples registros.
3. **Manejo de errores**: Implementa un manejo de errores robusto y registra detalles para facilitar la depuración.
4. **Progreso**: Actualiza el progreso de tareas largas para proporcionar retroalimentación.
5. **Notificaciones**: Notifica a los usuarios cuando las tareas se completan o fallan.
6. **Monitoreo**: Implementa métricas y registros para monitorear el rendimiento y la salud del sistema de tareas.
7. **Límites de recursos**: Establece límites de tiempo y memoria para evitar que tareas problemáticas afecten todo el sistema.
8. **Priorización**: Usa diferentes colas para priorizar tareas críticas.
9. **Reintentos**: Configura políticas de reintento adecuadas para diferentes tipos de tareas.
10. **Escalabilidad**: Diseña tu sistema de tareas para escalar horizontalmente cuando sea necesario.
```