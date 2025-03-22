import { Box, VStack, Text, Badge, Heading } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import axios from 'axios'

interface Alert {
  type: string
  message: string
  timestamp: string
  severity: 'error' | 'warning'
}

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([])

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await axios.get('http://localhost:5001/alerts')
        setAlerts(response.data.alerts)
      } catch (error) {
        console.error('Failed to fetch alerts:', error)
      }
    }

    fetchAlerts()
    const interval = setInterval(fetchAlerts, 2000)  // Poll every 2 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg="white">
      <Heading size="md" mb={4}>Safety Alerts</Heading>
      <VStack align="stretch" spacing={3}>
        {alerts.map((alert, index) => (
          <Box key={index} p={3} borderWidth="1px" borderRadius="md">
            <Badge colorScheme={alert.severity === 'error' ? 'red' : 'yellow'}>
              {alert.type}
            </Badge>
            <Text mt={2}>{alert.message}</Text>
            <Text fontSize="sm" color="gray.500">
              {new Date(alert.timestamp).toLocaleString()}
            </Text>
          </Box>
        ))}
        {alerts.length === 0 && (
          <Text color="gray.500">No active alerts</Text>
        )}
      </VStack>
    </Box>
  )
}
