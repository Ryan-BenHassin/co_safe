import { Box, VStack, Text, Badge, Heading, Button, HStack } from '@chakra-ui/react'
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

  const clearAlerts = async () => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_MAIN_SERVICE_URL}/alerts`)
      setAlerts([])
    } catch (error) {
      console.error('Failed to clear alerts:', error)
    }
  }

  return (
    <Box p={5} shadow="md" borderWidth="1px" borderRadius="lg" bg="white">
      <HStack justify="space-between" mb={4}>
        <Heading size="md">Safety Alerts</Heading>
        <Button 
          size="sm" 
          colorScheme="red" 
          onClick={clearAlerts}
          isDisabled={alerts.length === 0}
        >
          Clear All Alerts
        </Button>
      </HStack>
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
